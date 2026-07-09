import type { AgentGraphState } from '../agent-engine/engine/main/types/agent-engine.types';
import type { WorkflowRunState } from './workflow.types';
export declare function applyWorkflowAfterSummarize(state: AgentGraphState, input: {
    continuePlan: boolean;
    finished: boolean;
    summarizedPlanStepId?: string | null;
}): Pick<AgentGraphState, 'workflowRun' | 'workflowAwaitingReact'>;
export declare function mergeWorkflowExecutorOutcome(state: AgentGraphState, input: {
    workflowRun: WorkflowRunState;
    outputRef?: string;
    nodeOutput?: unknown;
}): AgentGraphState;
