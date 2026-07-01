import type { AgentRunStep } from '../types/agent-engine.types';
import type { WorkflowRunState } from '../../../../workflow/workflow.types';
import { isWorkflowBoundRun } from '../../../../workflow/workflow-plan-transition.util';

/** workflow_react 内环诊断步：图 state 保留全量，DB/SSE 仅持久化用户可见步。 */
export type RunStepAuditTier = 'user' | 'internal';

const INTERNAL_REACT_STEP_TYPES = new Set<AgentRunStep['type']>([
  'readiness',
  'llm',
  'result_check',
  'plan_sync',
]);

export function shouldTagWorkflowReactInternalAudit(state: {
  workflowRun?: WorkflowRunState | null;
  workflowAwaitingReact?: boolean;
}): boolean {
  return (
    state.workflowAwaitingReact === true && isWorkflowBoundRun(state.workflowRun)
  );
}

export function tagRunStepAuditTier(
  step: AgentRunStep,
  tier: RunStepAuditTier,
): AgentRunStep {
  if (tier === 'user') {
    return step;
  }
  return {
    ...step,
    meta: {
      ...step.meta,
      auditTier: 'internal',
    },
  };
}

export function maybeTagWorkflowReactInternalStep(
  step: AgentRunStep,
  state: {
    workflowRun?: WorkflowRunState | null;
    workflowAwaitingReact?: boolean;
  },
): AgentRunStep {
  if (
    shouldTagWorkflowReactInternalAudit(state) &&
    INTERNAL_REACT_STEP_TYPES.has(step.type)
  ) {
    return tagRunStepAuditTier(step, 'internal');
  }
  return step;
}

/** B 端 / SSE / DB 用户可见 run steps（保留 workflow、tool、gate、summarize）。 */
export function filterUserVisibleRunSteps(steps: AgentRunStep[]): AgentRunStep[] {
  return steps.filter((step) => step.meta?.auditTier !== 'internal');
}

export function stepsForRunPersistence(steps: AgentRunStep[]): AgentRunStep[] {
  return filterUserVisibleRunSteps(steps);
}
