import type { TaskDeliverable, TaskPlanSnapshot, TaskPlanStep } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowNodeDef } from './workflow.types';
export declare function inferDeliverableFromWorkflowNodes(nodes: WorkflowNodeDef[]): TaskDeliverable;
export declare function normalizeTaskPlanStepsForWorkflow(steps: TaskPlanStep[], nodes: WorkflowNodeDef[]): TaskPlanStep[];
export declare function normalizeTaskPlanSnapshotForWorkflow(input: {
    plan: TaskPlanSnapshot;
    nodes: WorkflowNodeDef[];
}): TaskPlanSnapshot;
