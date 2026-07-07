import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import { type PlanScopedTool } from '../main/plan/task-plan.util';
export declare function planHasPendingAnalyzeStep(taskPlan?: TaskPlanSnapshot | null): boolean;
export declare function resolvePagedGatherAnalyzeObjective(taskPlan?: TaskPlanSnapshot | null): string | undefined;
export declare function isReadListGatherToolStep(input: {
    taskPlan?: TaskPlanSnapshot | null;
    toolName: string;
    scopedTools: PlanScopedTool[];
}): boolean;
export declare function shouldExpandPlanPagedGather(input: {
    taskPlan?: TaskPlanSnapshot | null;
    toolName: string;
    scopedTools: PlanScopedTool[];
    output: unknown;
    args?: Record<string, unknown>;
    llmPayload?: {
        summary?: Record<string, unknown>;
    };
}): boolean;
export declare function planAwaitingPagedGatherCompletion(taskPlan?: TaskPlanSnapshot | null): boolean;
