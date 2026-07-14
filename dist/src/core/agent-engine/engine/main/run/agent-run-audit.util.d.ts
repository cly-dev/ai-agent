import type { AgentRunStep } from '../types/agent-engine.types';
import type { WorkflowRunState } from '../../../../workflow/workflow.types';
export type RunStepAuditTier = 'user' | 'internal';
export declare function shouldTagWorkflowReactInternalAudit(state: {
    workflowRun?: WorkflowRunState | null;
    workflowAwaitingReact?: boolean;
}): boolean;
export declare function tagRunStepAuditTier(step: AgentRunStep, tier: RunStepAuditTier): AgentRunStep;
export declare function maybeTagWorkflowReactInternalStep(step: AgentRunStep, state: {
    workflowRun?: WorkflowRunState | null;
    workflowAwaitingReact?: boolean;
}): AgentRunStep;
export declare function filterUserVisibleRunSteps(steps: AgentRunStep[]): AgentRunStep[];
export declare function stepsForRunPersistence(steps: AgentRunStep[]): AgentRunStep[];
