import type { AgentEngineTool } from '../agent-engine/engine/main/types/agent-engine.types';
import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunState } from './workflow.types';
export type WriteConfirmationPolicy = {
    kind: 'gate_now';
} | {
    kind: 'defer_to_workflow_await';
} | {
    kind: 'bypass_after_workflow_await';
};
export declare function workflowHasAwaitUserConfirmNode(defs: WorkflowNodeDef[] | null | undefined): boolean;
export declare function resolveWriteConfirmationPolicy(input: {
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    taskPlan?: TaskPlanSnapshot | null;
    approvedWriteToolNames?: Iterable<string>;
}): WriteConfirmationPolicy;
export declare function resolveApprovedWriteToolNamesAfterWorkflowAwait(input: {
    observations: ToolObservation[];
    scopedTools: AgentEngineTool[];
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): string[];
export declare function isWorkflowAwaitUserConfirmResume(input: {
    pendingToolCalls: Array<{
        name: string;
        arguments: Record<string, unknown>;
    }>;
    workflowRun?: WorkflowRunState | null;
}): boolean;
export declare function shouldDeferPlanPresentWriteGate(input: {
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): boolean;
