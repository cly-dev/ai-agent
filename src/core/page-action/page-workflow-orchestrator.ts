import type { ToolLevel } from '../../../generated/prisma/client';
import type { ApprovalGateService } from '../approval/approval-gate.service';
import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
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
import { resolvePageWorkflowPendingWrite } from './page-workflow-pending-write.util';
import {
  advanceWorkflowRun,
  finalizeWorkflowRun,
  initWorkflowRun,
  startWorkflowNode,
} from '../workflow/workflow-run.util';
import { advanceWorkflowRunAfterWriteConfirm } from '../workflow/workflow-resume.util';
import { logWorkflowDebug } from '../workflow/trace/workflow-debug.util';
import {
  executePageWorkflowNode,
  recordPageWorkflowNodeStart,
} from '../workflow/page/page-workflow-node-runner.util';
import { applyPageWorkflowNodeOutput } from './page-workflow-node.util';
import type { ApprovalTriggerBinding } from '../approval/resolve-approval-parties.util';
import { resolveApprovalParties } from '../approval/resolve-approval-parties.util';
import type { WorkflowRunState } from '../workflow/workflow.types';

export type PageWorkflowOrchestratorInput = PageWorkflowRunnerInput & {
  allowedToolIds: number[];
  approvalGate?: ApprovalGateService;
  /** 可选：PageAction.config 等触发绑定上的审批人覆盖。 */
  approvalTriggerBinding?: ApprovalTriggerBinding | null;
  /** 续跑：从挂起快照恢复（await_user_confirm 之后）。 */
  resumeFrom?: {
    workflowRun: WorkflowRunState;
    nodeOutputs: Record<string, unknown>;
    pendingWrite: ApprovalPendingWrite;
    advancePastAwait?: boolean;
  };
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

  if (input.resumeFrom) {
    runtime.nodeOutputs = { ...input.resumeFrom.nodeOutputs };
  }

  let workflowRun =
    input.resumeFrom?.workflowRun ??
    initWorkflowRun({
      workflowId: input.workflowId,
      version: input.version,
      nodes: input.nodes,
      compiledFrom: input.resumeFrom ? 'resume' : 'workflow_db',
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
    workflowRun,
  });

  while (workflowRun.currentNodeId && workflowRun.status === 'running') {
    const nodeId = workflowRun.currentNodeId;
    const def = input.nodes.find((row) => row.id === nodeId);
    if (!def) {
      return buildSuspendedOrFinal({
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
          workflowRun,
          runtime,
          recorder,
          errorCode: reactResult.errorCode,
          errorMessage: reactResult.errorMessage,
        });
      }
      runtime.nodeOutputs[nodeId] = reactResult.nodeOutput;
      workflowRun = advanceWorkflowRun(workflowRun);
      continue;
    }

    if (nodeResult.kind === 'suspend') {
      if (!input.approvalGate) {
        return buildSuspendedOrFinal({
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
          workflowRun,
          runtime,
          recorder,
          errorCode: 'APPROVAL_PARTIES_INVALID',
          errorMessage: `Cannot resolve approval parties: ${parties.code}`,
        });
      }

      const approval = await input.approvalGate.suspend({
        appClientId: input.appClientId,
        source: 'page_action',
        initiatorUserId: parties.parties.initiatorUserId,
        approverUserId: parties.parties.approverUserId,
        workflowId: input.workflowId,
        workflowVersion: input.version,
        nodeId,
        title: `${input.actionKey} · ${def.name}`,
        summary: null,
        workflowRun,
        workflowNodeDefs: input.nodes,
        workflowNodeOutputs: { ...runtime.nodeOutputs },
        pendingWrite: input.approvalGate.buildPendingWriteFromTool({
          name: pendingWrite.tool,
          arguments: pendingWrite.arguments,
          riskLevel: pendingWrite.riskLevel as ToolLevel,
        }),
        scopedToolIds: input.allowedToolIds,
        pageContext: input.pageContext,
        pageActionRunId: input.actionRunId,
        channel: { kind: 'page_action', pageActionRunId: input.actionRunId },
        stepRecorder: recorder,
      });

      logWorkflowDebug('page_workflow_suspended', {
        actionRunId: input.actionRunId,
        approvalRequestId: approval.id,
        nodeId,
        workflowRun,
      });

      return {
        ...buildPageWorkflowRunnerResult({
          workflowRun,
          runtime,
          recorder,
        }),
        suspended: true,
        approvalRequestId: approval.id,
      };
    }

    if (nodeResult.kind === 'completed') {
      applyPageWorkflowNodeOutput(runtime, nodeResult.outcome);
      workflowRun = advanceWorkflowRun(workflowRun);
      if (!workflowRun.currentNodeId && workflowRun.status === 'running') {
        workflowRun = finalizeWorkflowRun(workflowRun, 'completed');
      }
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

  return buildSuspendedOrFinal({ workflowRun, runtime, recorder });
}

function buildSuspendedOrFinal(input: {
  workflowRun: WorkflowRunState;
  runtime: ReturnType<typeof createPageWorkflowExecutorRuntime>;
  recorder: PageActionRunStepRecorder;
  errorCode?: string;
  errorMessage?: string;
}): PageWorkflowOrchestratorResult {
  return {
    ...buildPageWorkflowRunnerResult({
      workflowRun: input.workflowRun,
      runtime: input.runtime,
      recorder: input.recorder,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
    }),
    suspended: false,
  };
}
