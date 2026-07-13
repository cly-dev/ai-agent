import type { TaskPlanSnapshot, TaskPlanStep } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowNodeDef } from './workflow.types';
export declare function compileTaskPlanFromWorkflowNodes(nodes: WorkflowNodeDef[]): TaskPlanStep[];
export declare function compileTaskPlanFromWorkflow(input: {
    nodes: WorkflowNodeDef[];
    originalUserRequest: string;
    goal?: string;
}): TaskPlanSnapshot | null;
