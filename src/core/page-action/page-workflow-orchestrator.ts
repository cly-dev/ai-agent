import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
import type { PageWorkflowToolBundle } from './page-workflow-tool-bundle.util';
import type { ApprovalGateService } from '../approval/approval-gate.service';
import {
  PageActionRunStepRecorder,
  type PageActionRunStep,
} from './page-action-run-steps.util';
import {
  buildPageWorkflowRunnerResult,
  createPageWorkflowExecutorRuntime,
  type PageWorkflowRunnerInput,
  type PageWorkflowRunnerResult,
} from './page-workflow-runtime.util';
import { runPageWorkflowMutationReact } from './page-workflow-mutation-react.util';
import { resolvePageWorkflowPendingWrite, resolvePageWorkflowPresentSummary } from './page-workflow-pending-write.util';
import {
  advanceWorkflowRun,
  finalizeWorkflowRunAfterAdvance,
  initWorkflowRun,
  startWorkflowNode,
  tryAdvanceNativePhaseAfterNodeSuccess,
} from '../workflow/workflow-run.util';
import { advanceWorkflowRunAfterWriteConfirm } from '../workflow/workflow-resume.util';
import { logWorkflowDebug } from '../workflow/trace/workflow-debug.util';
import {
  executePageWorkflowNode,
  recordPageWorkflowNodeStart,
} from '../workflow/page/page-workflow-node-runner.util';
import { applyPageWorkflowNodeOutput } from './page-workflow-node.util';
import { buildPageWriteDraft } from '../draft-review';
import type { ApprovalTriggerBinding } from '../approval/resolve-approval-parties.util';
import { resolveApprovalParties } from '../approval/resolve-approval-parties.util';
import {
  materializeNativeFlatIrNode,
} from '../workflow/workflow-ir-native-direct.util';
import {
  materializeEntitiesFromRuntimeContext,
  recordPageActionEntityMaterialization,
} from '../entity-materialization';
import {
  materializeWorkflowIrNodeForPhase,
  resolveWorkflowIrNativePhases,
} from '../workflow/workflow-ir-native-phase.util';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';

export type PageWorkflowOrchestratorInput = PageWorkflowRunnerInput & {
  allowedToolIds: number[];
  toolBundle?: PageWorkflowToolBundle | null;
  approvalGate?: ApprovalGateService;
  /** 可选：PageAction.config 等触发绑定上的审批人覆盖。 */
  approvalTriggerBinding?: ApprovalTriggerBinding | null;
  /** 续跑：从挂起快照恢复（await_user_confirm 之后）。 */
  resumeFrom?: {
    workflowRun: WorkflowRunState;
    nodeOutputs: Record<string, unknown>;
    pendingWrite?: ApprovalPendingWrite | null;
    advancePastAwait?: boolean;
  };
  /** 重试挂起时刷新既有审批单。 */
  existingApprovalRequestId?: number | null;
  /** 重试时附加到 objective 的补充说明。 */
  retryInstruction?: string | null;
  /** invoke 时派生的去重键；挂审批时写入 ApprovalRequest.idempotencyKey。 */
  pageActionKey?: string | null;
};

export type PageWorkflowOrchestratorResult = PageWorkflowRunnerResult & {
  suspended?: boolean;
  approvalRequestId?: number;
};

/**
 * page workflow 主编排器：节点循环 + react + 审批挂起为一等公民状态。
 * 替代原 runPageWorkflow 内联 while，避免在 runner 中打补丁。
 */
export async function orchestratePageWorkflow(
  input: PageWorkflowOrchestratorInput,
): Promise<PageWorkflowOrchestratorResult> {
  const recorder =
    input.stepRecorder ?? new PageActionRunStepRecorder();
  const runtime = createPageWorkflowExecutorRuntime(input, recorder);

  runtime.materializedEntities = materializeEntitiesFromRuntimeContext({
    pageContext: input.pageContext,
    actionContext: input.actionContext ?? null,
  });
  if (!input.resumeFrom) {
    recordPageActionEntityMaterialization(
      recorder,
      runtime.materializedEntities,
    );
  }

  if (input.resumeFrom) {
    runtime.nodeOutputs = { ...input.resumeFrom.nodeOutputs };
  }

  let workflowRun =
    input.resumeFrom?.workflowRun ??
    initWorkflowRun({
      workflowId: input.workflowId,
      version: input.version,
      nodes: input.nodes,
      edges: input.edges,
      entryNodeId: input.entryNodeId,
      compiledFrom: input.flowId ? 'flow_db' : 'workflow_db',
      // Plan A：native 入口相位，避免 present 完成后误当成 execute 跳过 await
      phasesByNodeId:
        input.executionMode === 'ir_native_direct' && input.ir
          ? Object.fromEntries(
              input.ir.nodes.map((node) => [
                node.id,
                resolveWorkflowIrNativePhases(node)[0]!,
              ]),
            )
          : undefined,
    });

  if (input.resumeFrom?.advancePastAwait) {
    workflowRun = advanceWorkflowRunAfterWriteConfirm(workflowRun);
  }

  logWorkflowDebug('page_workflow_start', {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    workflowId: input.workflowId,
    version: input.version,
    resumed: input.resumeFrom != null,
    nodeIds: input.nodes.map((row) => row.id),
    executionMode: input.executionMode ?? 'materialized_expand',
    irNodeCount: input.ir?.nodes.length ?? 0,
    workflowRun,
  });

  while (workflowRun.currentNodeId && workflowRun.status === 'running') {
    const nodeId = workflowRun.currentNodeId;
    // Plan A：native 时从 IR + 当前 phase 合成 def
    const runNode = workflowRun.nodes.find((row) => row.nodeId === nodeId);
    const irNode =
      input.executionMode === 'ir_native_direct'
        ? input.ir?.nodes.find((row) => row.id === nodeId)
        : undefined;
    const def: WorkflowNodeDef | undefined =
      irNode != null
        ? (() => {
            try {
              const phase = runNode?.phase;
              return phase
                ? materializeWorkflowIrNodeForPhase(irNode, phase)
                : materializeNativeFlatIrNode(irNode);
            } catch {
              return undefined;
            }
          })()
        : input.nodes.find((row) => row.id === nodeId);
    if (!def) {
      return buildSuspendedOrFinal({
        workflowNodes: input.nodes,
        workflowRun: {
          ...workflowRun,
          status: 'failed',
        },
        runtime,
        recorder,
        errorCode: 'NODE_DEF_MISSING',
        errorMessage: `workflow node definition missing: ${nodeId}`,
      });
    }

    workflowRun = startWorkflowNode(workflowRun, nodeId);
    recordPageWorkflowNodeStart({
      action: def.action,
      nodeId,
      recorder,
    });

    const nodeResult = await executePageWorkflowNode({
      def,
      nodeId,
      workflowRun,
      runtime,
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
    });

    workflowRun = nodeResult.workflowRun;

    if (nodeResult.kind === 'failed') {
      return buildSuspendedOrFinal({
        workflowNodes: input.nodes,
        workflowRun,
        runtime,
        recorder,
        errorCode: nodeResult.errorCode,
        errorMessage: nodeResult.errorMessage,
      });
    }

    if (nodeResult.kind === 'react') {
      const reactResult = await runPageWorkflowMutationReact({
        def,
        nodeId,
        workflowRun,
        runtime,
        allowedToolIds: input.allowedToolIds,
        pendingWrite: input.resumeFrom?.pendingWrite ?? null,
      });
      workflowRun = reactResult.workflowRun;
      if (reactResult.ok === false) {
        return buildSuspendedOrFinal({
          workflowNodes: input.nodes,
          workflowRun,
          runtime,
          recorder,
          errorCode: reactResult.errorCode,
          errorMessage: reactResult.errorMessage,
        });
      }
      runtime.nodeOutputs[nodeId] = reactResult.nodeOutput;
      workflowRun = advanceWorkflowRun(workflowRun);
      // react 路径（compose_mutation / write_data）与 completed 路径一样：
      // 无下一节点时必须 finalize，否则 status 停留在 running → WORKFLOW_INCOMPLETE。
      workflowRun = finalizeWorkflowRunAfterAdvance(workflowRun);
      continue;
    }

    if (nodeResult.kind === 'suspend') {
      if (!input.approvalGate) {
        return buildSuspendedOrFinal({
          workflowNodes: input.nodes,
          workflowRun,
          runtime,
          recorder,
          errorCode: 'APPROVAL_GATE_UNAVAILABLE',
          errorMessage: 'Approval gate service required for await_user_confirm',
        });
      }

      const pendingWrite = resolvePageWorkflowPendingWrite({
        nodes: input.nodes,
        nodeOutputs: runtime.nodeOutputs,
      });
      if (!pendingWrite) {
        return buildSuspendedOrFinal({
          workflowNodes: input.nodes,
          workflowRun,
          runtime,
          recorder,
          errorCode: 'PENDING_WRITE_MISSING',
          errorMessage:
            'await_user_confirm requires composed write in nodeOutputs',
        });
      }

      const parties = resolveApprovalParties({
        source: 'page_action',
        initiatorUserId: input.userId,
        triggerBinding: input.approvalTriggerBinding ?? null,
      });
      if (parties.ok === false) {
        return buildSuspendedOrFinal({
          workflowNodes: input.nodes,
          workflowRun,
          runtime,
          recorder,
          errorCode: 'APPROVAL_PARTIES_INVALID',
          errorMessage: `Cannot resolve approval parties: ${parties.code}`,
        });
      }

      const presentSummary = resolvePageWorkflowPresentSummary({
        nodes: input.nodes,
        nodeOutputs: runtime.nodeOutputs,
        fillText: runtime.fillText,
      });
      const writeDraft = buildPageWriteDraft({
        tool: {
          name: pendingWrite.tool,
          toolId: pendingWrite.toolId,
          riskLevel: pendingWrite.riskLevel,
          arguments: pendingWrite.arguments,
        },
        summaryText: presentSummary,
        fillText: runtime.fillText,
        draftRetryCount:
          input.existingApprovalRequestId != null
            ? undefined
            : 0,
        lastEvent: 'composed',
      });

      if (input.flowId == null || input.flowId <= 0) {
        throw new Error(
          'PageAction approval requires flowId; legacy Workflow path removed',
        );
      }
      const approval = await input.approvalGate.suspend({
        appClientId: input.appClientId,
        source: 'page_action',
        initiatorUserId: parties.parties.initiatorUserId,
        approverUserId: parties.parties.approverUserId,
        flowId: input.flowId,
        flowVersion: input.flowVersion ?? input.version,
        nodeId,
        title: `${input.actionKey} · ${def.name}`,
        writeDraft,
        workflowRun,
        workflowNodeDefs: input.nodes,
        workflowNodeOutputs: { ...runtime.nodeOutputs },
        scopedToolIds: input.allowedToolIds,
        pageContext: input.pageContext,
        pageActionRunId: input.actionRunId,
        idempotencyKey: input.pageActionKey ?? null,
        channel: { kind: 'page_action', pageActionRunId: input.actionRunId },
        stepRecorder: recorder,
        existingApprovalRequestId: input.existingApprovalRequestId ?? null,
      });

      logWorkflowDebug('page_workflow_suspended', {
        actionRunId: input.actionRunId,
        approvalRequestId: approval.id,
        nodeId,
        workflowRun,
      });

      return {
        ...buildPageWorkflowRunnerResult({
          workflowNodes: input.nodes,
          workflowRun,
          runtime,
          recorder,
          suspended: true,
          approvalRequestId: approval.id,
        }),
        suspended: true,
        approvalRequestId: approval.id,
      };
    }

    if (nodeResult.kind === 'completed') {
      applyPageWorkflowNodeOutput(runtime, nodeResult.outcome);
      if (input.executionMode === 'ir_native_direct' && irNode) {
        const phaseStep = tryAdvanceNativePhaseAfterNodeSuccess({
          run: workflowRun,
          nodeId,
          irNode,
        });
        workflowRun = phaseStep.workflowRun;
        if (phaseStep.advancedPhase) {
          logWorkflowDebug('page_node_phase_advanced', {
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            nodeId,
            phase: workflowRun.nodes.find((n) => n.nodeId === nodeId)?.phase,
            workflowRun,
          });
          continue;
        }
      }
      workflowRun = advanceWorkflowRun(workflowRun);
      workflowRun = finalizeWorkflowRunAfterAdvance(workflowRun);
      logWorkflowDebug('page_node_advanced', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        nodeId,
        workflowRun,
      });
    }
  }

  logWorkflowDebug('page_workflow_finish', {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    workflowRun,
    fillTextLength: runtime.fillText.trim().length,
    dslOutcome: runtime.dslOutcome,
  });

  return buildSuspendedOrFinal({
    workflowNodes: input.nodes,
    workflowRun,
    runtime,
    recorder,
  });
}

function buildSuspendedOrFinal(input: {
  workflowNodes: WorkflowNodeDef[];
  workflowRun: WorkflowRunState;
  runtime: ReturnType<typeof createPageWorkflowExecutorRuntime>;
  recorder: PageActionRunStepRecorder;
  errorCode?: string;
  errorMessage?: string;
}): PageWorkflowOrchestratorResult {
  return {
    ...buildPageWorkflowRunnerResult({
      workflowNodes: input.workflowNodes,
      workflowRun: input.workflowRun,
      runtime: input.runtime,
      recorder: input.recorder,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
    }),
    suspended: false,
  };
}
