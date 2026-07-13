import type { WorkflowRunState } from '../../../../workflow/workflow.types';
import type { PlanObservationBuckets } from './plan-observation-scope.util';
import { planSummarizeRequiresToolEvidence } from './plan-summarize-gate.util';
import {
  getPendingPlanToolStep,
  isPendingPlanAnswerStep,
} from './task-plan.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import type { PendingRespond } from '../../turn/turn-respond.types';
import {
  CLARIFICATION_REQUEST_OBSERVATION_NAME,
  resolveObservationForSummarize,
} from '../../turn/turn-respond.util';

const PARAM_GATE_CLARIFICATION_PREFIX = 'param_gate:';

export function isParamGateSourcedClarification(input: {
  readinessReason?: unknown;
}): boolean {
  return (
    typeof input.readinessReason === 'string' &&
    input.readinessReason.startsWith(PARAM_GATE_CLARIFICATION_PREFIX)
  );
}

function readinessReasonFromPending(
  pending: PendingRespond,
): string | undefined {
  if (pending.mode === 'turn' && pending.request.kind === 'clarification') {
    return pending.request.payload?.readinessReason;
  }
  if (
    pending.mode === 'observation' &&
    pending.observation.name === CLARIFICATION_REQUEST_OBSERVATION_NAME
  ) {
    const output = pending.observation.output;
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      const reason = (output as Record<string, unknown>).readinessReason;
      return typeof reason === 'string' ? reason : undefined;
    }
  }
  return undefined;
}

/** gather 步 pending 且本轮尚未执行任何 HTTP/host 工具。 */
export function isGatherPendingWithoutToolExecution(input: {
  taskPlan?: TaskPlanSnapshot | null;
  workflowRun?: WorkflowRunState | null;
  observationBuckets: PlanObservationBuckets;
}): boolean {
  if (!planSummarizeRequiresToolEvidence(input.taskPlan)) {
    return false;
  }
  const runToolObs = input.observationBuckets.runOwned.filter(
    (row) => row.name !== CLARIFICATION_REQUEST_OBSERVATION_NAME,
  );
  if (runToolObs.length > 0) {
    return false;
  }
  const pendingGather = getPendingPlanToolStep(
    input.taskPlan,
    input.workflowRun,
  );
  if (pendingGather?.kind === 'tool' && pendingGather.phase === 'gather') {
    return true;
  }
  if (
    input.taskPlan &&
    isPendingPlanAnswerStep(input.taskPlan, input.workflowRun) &&
    planSummarizeRequiresToolEvidence(input.taskPlan)
  ) {
    return true;
  }
  return false;
}

/**
 * 业务澄清只允许来自 param_gate（已有 tool_calls 后的 schema 校验）。
 * 其它路径在 gather 未完成时不应反问用户。
 */
export function isPrematureGatherClarification(input: {
  taskPlan?: TaskPlanSnapshot | null;
  workflowRun?: WorkflowRunState | null;
  observationBuckets: PlanObservationBuckets;
  pendingRespond: PendingRespond | null | undefined;
}): boolean {
  if (!input.pendingRespond) {
    return false;
  }
  const observation = resolveObservationForSummarize(input.pendingRespond);
  if (!observation || observation.name !== CLARIFICATION_REQUEST_OBSERVATION_NAME) {
    return false;
  }
  if (
    isParamGateSourcedClarification({
      readinessReason: readinessReasonFromPending(input.pendingRespond),
    })
  ) {
    return false;
  }
  return isGatherPendingWithoutToolExecution(input);
}
