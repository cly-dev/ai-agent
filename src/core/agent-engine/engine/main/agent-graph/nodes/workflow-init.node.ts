import type { AgentGraphNodeBundle, AgentGraphNodeFn } from '../types/graph.types';
import { AgentRunStatus } from '../../../../../../../generated/prisma/client';
import { compileTaskPlanToWorkflow } from '../../../../../workflow/compile-plan-to-workflow.util';
import { isWorkflowCompatibleWithScope } from '../../../../../workflow/validate-workflow-against-scope.util';
import {
  appendWorkflowInitRunStep,
  appendWorkflowInitSkippedStep,
  buildWorkflowInitRunStepOutput,
} from '../../../../../workflow/workflow-init-audit.util';
import {
  resolveSkillWorkflowForInit,
  resolveWorkflowBoundSkillId,
} from '../../../../../workflow/workflow-init-skill.util';
import {
  buildWorkflowResumeGraphSlice,
  hydrateTaskPlanWithWorkflowDefs,
  isResumableWorkflowRun,
  resolveWorkflowDefsForResume,
  shouldAwaitReactOnWorkflowResume,
} from '../../../../../workflow/workflow-resume.util';
import { logWorkflowDebug } from '../../../../../workflow/trace/workflow-debug.util';
import {
  buildWorkflowInitSkippedPendingRespond,
  type WorkflowInitSkipReason,
} from '../../../../../workflow/workflow-init-skip.util';
import type { AgentGraphState } from '../../types/agent-engine.types';
import { nextRunStepNumber } from '../../run/agent-run-steps.util';
import { createPlanNode } from './plan.node';
import type { WorkflowNodeDef } from '../../../../../workflow/workflow.types';

function skipIfTriggerPermissionDenied(
  bundle: AgentGraphNodeBundle,
  state: AgentGraphState,
  nodes: WorkflowNodeDef[],
  allowedToolIds: number[],
  skillId?: number | null,
  userMessage?: string,
): AgentGraphState | null {
  const decision = bundle.deps.approvalTriggerPermission.evaluateForNodes({
    nodes,
    allowedToolIds,
  });
  if (decision.allowed === true) {
    return null;
  }
  const missingToolIds = decision.missingToolIds;
  bundle.deps.logger.warn(
    `workflow_init trigger permission denied runId=${bundle.ctx.input.runId} missingToolIds=${missingToolIds.join(',')}`,
  );
  logWorkflowDebug('init_trigger_permission_denied', {
    runId: bundle.ctx.input.runId,
    sessionId: bundle.ctx.input.sessionId,
    missingToolIds,
    skillId,
  });
  return annotateWorkflowInitSkipped(
    state,
    'trigger_permission_denied',
    { skillId },
    userMessage,
  );
}

function annotateWorkflowInitSkipped(
  state: AgentGraphState,
  reason: WorkflowInitSkipReason,
  extra?: { skillId?: number | null; nodeIds?: string[] },
  userMessage?: string,
): AgentGraphState {
  const stepNum = nextRunStepNumber(state.steps);
  const pendingRespond =
    state.pendingRespond ??
    buildWorkflowInitSkippedPendingRespond({
      reason,
      userMessage: userMessage ?? '',
    });
  return {
    ...state,
    steps: appendWorkflowInitSkippedStep(state.steps, stepNum, {
      reason,
      skillId: extra?.skillId,
      nodeIds: extra?.nodeIds,
    }),
    ...(pendingRespond ? { pendingRespond } : {}),
  };
}

function finalizeWorkflowInit(
  state: AgentGraphState,
  input: {
    workflowRun: NonNullable<AgentGraphState['workflowRun']>;
    nodes: NonNullable<AgentGraphState['workflowNodeDefs']>;
    source: 'resume' | 'workflow_db' | 'plan_compile';
    skillId?: number | null;
    workflowAwaitingReact?: boolean;
  },
): AgentGraphState {
  const stepNum = nextRunStepNumber(state.steps);
  const output = buildWorkflowInitRunStepOutput({
    workflowRun: input.workflowRun,
    nodes: input.nodes,
    source: input.source,
    skillId: input.skillId,
  });
  const steps = appendWorkflowInitRunStep(state.steps, stepNum, output);
  return {
    ...state,
    steps,
    taskPlan: state.taskPlan
      ? hydrateTaskPlanWithWorkflowDefs({
          taskPlan: state.taskPlan,
          workflowNodeDefs: input.nodes,
        }) ?? state.taskPlan
      : state.taskPlan,
    workflowRun: input.workflowRun,
    workflowNodeDefs: input.nodes,
    workflowNodeOutputs: state.workflowNodeOutputs ?? {},
    workflowAwaitingReact: input.workflowAwaitingReact ?? false,
  };
}

/**
 * V2 LangGraph 主轴：plan 步序解析 → compile / load 为 L1 workflowRun。
 * 契约未通过时 plan 节点已 terminalRespond，此处不再 init workflow。
 */
export function createWorkflowInitNode(
  bundle: AgentGraphNodeBundle,
): AgentGraphNodeFn {
  const planNode = createPlanNode(bundle);
  const { deps, ctx, runHelpers } = bundle;
  const debugBase = {
    runId: ctx.input.runId,
    sessionId: ctx.input.sessionId,
    turnId: ctx.input.turnId,
    appClientId: ctx.input.appClientId,
    agentId: ctx.input.agentId,
  };

  return async (state) => {
    const afterPlan = state.taskPlan ? state : await planNode(state);
    if (afterPlan.finished || !afterPlan.taskPlan) {
      logWorkflowDebug('init_skipped', {
        ...debugBase,
        reason: afterPlan.finished ? 'finished' : 'no_task_plan',
        finished: afterPlan.finished,
      });
      return afterPlan.finished
        ? afterPlan
        : annotateWorkflowInitSkipped(
            afterPlan,
            'no_task_plan',
            undefined,
            ctx.input.latestUserMessage,
          );
    }

    if (
      isResumableWorkflowRun(afterPlan.workflowRun) &&
      afterPlan.workflowNodeDefs &&
      afterPlan.workflowNodeDefs.length > 0
    ) {
      logWorkflowDebug('init_restore_graph_state', {
        ...debugBase,
        workflowRun: afterPlan.workflowRun,
        nodeDefCount: afterPlan.workflowNodeDefs.length,
        workflowAwaitingReact: afterPlan.workflowAwaitingReact === true,
      });
      return {
        ...afterPlan,
        workflowAwaitingReact:
          afterPlan.workflowAwaitingReact === true ||
          shouldAwaitReactOnWorkflowResume(
            afterPlan.workflowRun,
            afterPlan.workflowNodeDefs,
          ),
      };
    }

    const scope = {
      allowedToolIds:
        bundle.ctx.input.allowedToolIds ??
        afterPlan.scopedAllowedToolIds ??
        [],
      allowedHostToolIds: (afterPlan.scopedHostTools ?? []).map((row) => row.id),
    };

    const boundSkillId = resolveWorkflowBoundSkillId(bundle, afterPlan);

    if (afterPlan.planRunContext === 'resume') {
      const savedRun = bundle.ctx.getSessionGoa()?.activeTask?.workflowRun;
      if (isResumableWorkflowRun(savedRun)) {
        const nodes = await resolveWorkflowDefsForResume(deps.prisma, {
          savedRun,
          taskPlan: afterPlan.taskPlan,
          appClientId: ctx.input.appClientId,
          scope,
        });
        if (nodes) {
          const resumed = buildWorkflowResumeGraphSlice({
            savedRun,
            nodes,
          });
          const next = finalizeWorkflowInit(afterPlan, {
            workflowRun: resumed.workflowRun,
            nodes: resumed.workflowNodeDefs,
            source: 'resume',
            workflowAwaitingReact: resumed.workflowAwaitingReact,
          });
          await runHelpers.updateRun(
            ctx.input.runId,
            next.steps,
            AgentRunStatus.running,
          );
          logWorkflowDebug('init_resume_goa', {
            ...debugBase,
            outcome: 'ok',
            workflowRun: next.workflowRun,
            source: 'resume',
          });
          return next;
        }
        deps.logger.warn(
          `workflow_init resume defs mismatch runId=${ctx.input.runId} workflowId=${savedRun.workflowId}`,
        );
        logWorkflowDebug('init_resume_goa', {
          ...debugBase,
          outcome: 'defs_mismatch',
          workflowId: savedRun.workflowId,
          workflowRun: savedRun,
        });
        return annotateWorkflowInitSkipped(
          afterPlan,
          'resume_defs_mismatch',
          { skillId: boundSkillId },
          ctx.input.latestUserMessage,
        );
      }
    }

    if (boundSkillId != null) {
      const skillWorkflow = await resolveSkillWorkflowForInit(deps.prisma, {
        skillId: boundSkillId,
        appClientId: ctx.input.appClientId,
      });
      if (skillWorkflow.kind === 'loaded') {
        const denied = skipIfTriggerPermissionDenied(
          bundle,
          afterPlan,
          skillWorkflow.workflow.nodes,
          scope.allowedToolIds,
          boundSkillId,
          ctx.input.latestUserMessage,
        );
        if (denied) {
          await runHelpers.updateRun(
            ctx.input.runId,
            denied.steps,
            AgentRunStatus.running,
          );
          return denied;
        }
        const next = finalizeWorkflowInit(afterPlan, {
          workflowRun: skillWorkflow.workflow.workflowRun,
          nodes: skillWorkflow.workflow.nodes,
          source: 'workflow_db',
          skillId: boundSkillId,
        });
        await runHelpers.updateRun(
          ctx.input.runId,
          next.steps,
          AgentRunStatus.running,
        );
        logWorkflowDebug('init_db_load', {
          ...debugBase,
          outcome: 'ok',
          skillId: boundSkillId,
          workflowRun: next.workflowRun,
          source: 'workflow_db',
        });
        return next;
      }
      if (skillWorkflow.kind === 'load_failed') {
        deps.logger.warn(
          `workflow_init db load failed runId=${ctx.input.runId} skillId=${boundSkillId} workflowId=${skillWorkflow.workflowId} reason=${skillWorkflow.reason}`,
        );
        logWorkflowDebug('init_db_load', {
          ...debugBase,
          outcome: 'failed',
          skillId: boundSkillId,
          workflowId: skillWorkflow.workflowId,
          failureReason: skillWorkflow.reason,
        });
        return annotateWorkflowInitSkipped(
          afterPlan,
          'db_load_failed',
          { skillId: boundSkillId },
          ctx.input.latestUserMessage,
        );
      }
      if (skillWorkflow.kind === 'scope_incompatible') {
        deps.logger.warn(
          `workflow_init scope incompatible with bound workflow runId=${ctx.input.runId} skillId=${boundSkillId} workflowId=${skillWorkflow.workflowId}; falling back to plan_compile`,
        );
        logWorkflowDebug('init_db_load_scope_fallback', {
          ...debugBase,
          skillId: boundSkillId,
          workflowId: skillWorkflow.workflowId,
        });
      } else {
        logWorkflowDebug('init_plan_compile_deferred', {
          ...debugBase,
          skillId: boundSkillId,
          reason: 'no_workflow_binding',
        });
      }
    }

    const compiled = compileTaskPlanToWorkflow({
      plan: afterPlan.taskPlan,
      workflowId: 0,
      version: 1,
      resolveMethod:
        afterPlan.planRunContext === 'resume' ? 'session_resume' : undefined,
    });
    if (!compiled) {
      return annotateWorkflowInitSkipped(
        afterPlan,
        'compile_empty',
        { skillId: boundSkillId },
        ctx.input.latestUserMessage,
      );
    }
    const scopeCompatible = isWorkflowCompatibleWithScope({
      nodes: compiled.nodes,
      scope,
    });
    if (!scopeCompatible) {
      deps.logger.warn(
        `workflow_init scope mismatch runId=${ctx.input.runId}; proceeding with compiled workflow (runtime scope enforced at execute)`,
      );
      logWorkflowDebug('init_scope_mismatch', {
        ...debugBase,
        skillId: boundSkillId,
        nodeIds: compiled.nodes.map((row) => row.id),
        outcome: 'proceed_with_warning',
      });
    }
    const denied = skipIfTriggerPermissionDenied(
      bundle,
      afterPlan,
      compiled.nodes,
      scope.allowedToolIds,
      boundSkillId,
      ctx.input.latestUserMessage,
    );
    if (denied) {
      await runHelpers.updateRun(
        ctx.input.runId,
        denied.steps,
        AgentRunStatus.running,
      );
      return denied;
    }
    const next = finalizeWorkflowInit(afterPlan, {
      workflowRun: compiled.workflowRun,
      nodes: compiled.nodes,
      source: 'plan_compile',
      skillId: boundSkillId,
    });
    await runHelpers.updateRun(
      ctx.input.runId,
      next.steps,
      AgentRunStatus.running,
    );
    logWorkflowDebug('init_plan_compile', {
      ...debugBase,
      outcome: 'ok',
      skillId: boundSkillId,
      compiledFrom: next.workflowRun?.compiledFrom ?? null,
      workflowRun: next.workflowRun,
      source: 'plan_compile',
    });
    return next;
  };
}
