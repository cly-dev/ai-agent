import type { TaskPlanSnapshot, TaskPlanStep } from '../agent-engine/engine/main/plan/task-plan.types';
import type { WorkflowNodeDef, WorkflowRunCompiledFrom, WorkflowRunState } from './workflow.types';
export declare function compileTaskPlanToWorkflowNodes(steps: TaskPlanStep[]): WorkflowNodeDef[];
export type CompileTaskPlanToWorkflowResult = {
    nodes: WorkflowNodeDef[];
    workflowRun: WorkflowRunState;
    compiledFrom: WorkflowRunCompiledFrom;
};
export declare function compileTaskPlanToWorkflow(input: {
    plan: TaskPlanSnapshot;
    workflowId?: number;
    version?: number;
    resolveMethod?: string;
}): CompileTaskPlanToWorkflowResult | null;
