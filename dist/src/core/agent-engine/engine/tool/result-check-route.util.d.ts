import type { GraphToolCall } from '../main/types/agent-engine.types';
import type { TaskPlanAdvanceResult, TaskPlanSnapshot } from '../main/plan/task-plan.types';
import { type PlanScopedTool } from '../main/plan/task-plan.util';
import type { ResultCheckOutcome } from './tool-result-check.util';
export type ResultCheckRouteAuthority = 'plan' | 'react' | 'safety_abort';
export type ResultCheckPlanFallback = {
    action: 'summarize';
    authority: 'plan';
    supersededPendingToolCallCount: number;
} | {
    action: 'llm_continue';
    authority: 'plan';
    clearPendingToolCalls: boolean;
    reason: string;
} | {
    action: 'skill_step';
    authority: 'plan';
};
export declare function resolveResultCheckPlanFallback(input: {
    outcome: ResultCheckOutcome;
    planAdvance: TaskPlanAdvanceResult | null;
}): ResultCheckPlanFallback | null;
export declare function resolveSkillStepPendingToolCalls(input: {
    pendingToolCalls: GraphToolCall[];
    taskPlan: TaskPlanSnapshot | null | undefined;
    scopedTools: PlanScopedTool[];
}): GraphToolCall[];
