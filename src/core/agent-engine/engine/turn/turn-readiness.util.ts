import type { WorkflowRunState } from '../../../workflow/workflow.types';
import {
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
  isPlanToolStepSatisfiedByObservations,
  type PlanScopedTool,
} from '../main/plan/task-plan.util';
import {
  selectObservationsForPlanToolSatisfaction,
  type PlanObservationBuckets,
} from '../main/plan/plan-observation-scope.util';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import type { AgentChatPageContext } from '../../../host-bridge/page-context.types';
import type { PageContextUsage } from '../../../host-bridge/page-context-usage.types';
import { resolvePageContextEntityIdForPlanSatisfaction } from '../../../host-bridge/page-context-usage.util';
import type {
  TurnReadinessResult,
  TurnRespondRequest,
} from './turn-respond.types';

export type EvaluateExecutionReadinessInput = {
  userMessage: string;
  taskPlan?: TaskPlanSnapshot | null;
  scopedTools: PlanScopedTool[];
  skillConfig?: unknown;
  resumeFromWriteConfirm?: boolean;
  pageContext?: AgentChatPageContext | null;
  pageContextUsage?: Pick<PageContextUsage, 'applies' | 'entityId'> | null;
  observationBuckets: PlanObservationBuckets;
  workflowRun?: WorkflowRunState | null;
};

function ready(reason: string): TurnReadinessResult {
  return { status: 'ready', reason };
}

function respond(
  reason: string,
  request: TurnRespondRequest,
): TurnReadinessResult {
  return { status: 'respond', reason, request };
}

/**
 * Plan gather 步的结构化就绪检查（无 LLM、不推断业务参数）。
 *
 * 职责边界：
 * - readiness：scope 是否可用、observation 是否已满足当前 plan 步
 * - llm.tool_decision：选工具、从用户消息/pageContext 填参
 * - result_check / summarize：执行失败或需澄清时再反问用户
 */
export async function evaluateExecutionReadiness(
  input: EvaluateExecutionReadinessInput,
): Promise<TurnReadinessResult> {
  if (input.resumeFromWriteConfirm) {
    return ready('write_confirm_resume');
  }

  const userMessage = input.userMessage.trim();
  const plan = input.taskPlan;
  if (!plan || isPendingPlanAnswerStep(plan, input.workflowRun)) {
    return ready('plan_answer_or_missing');
  }

  const gatherStep = getPendingPlanToolStep(plan, input.workflowRun);
  if (!gatherStep || gatherStep.kind !== 'tool') {
    return ready('no_gather_step');
  }

  if (input.scopedTools.length === 0) {
    return respond('unsupported_scope', {
      kind: 'unsupported_scope',
      userMessage,
      payload: { readinessReason: 'no_scoped_tools' },
    });
  }

  const satisfactionObservations = selectObservationsForPlanToolSatisfaction(
    input.observationBuckets,
  );
  const pageContextEntityId = resolvePageContextEntityIdForPlanSatisfaction({
    pageContextUsage: input.pageContextUsage,
    pageContext: input.pageContext,
  });
  if (
    isPlanToolStepSatisfiedByObservations({
      step: gatherStep,
      observations: satisfactionObservations,
      scopedTools: input.scopedTools,
      taskPlan: plan,
      skillConfig: input.skillConfig,
      purpose: 'pre_tools_advance',
      pageContextEntityId,
    })
  ) {
    return ready('observation_satisfied');
  }

  return ready('awaiting_tool_decision');
}
