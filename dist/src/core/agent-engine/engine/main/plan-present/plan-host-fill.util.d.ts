import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { GraphToolCall, ToolObservation } from '../types/agent-engine.types';
import type { TaskPlanSnapshot, TaskPlanStep } from '../plan/task-plan.types';
export declare const PLAN_HOST_FILL_OBSERVATION_NAME = "plan_host_fill";
export type PlanHostFillEntry = {
    tool: string;
    arguments: Record<string, unknown>;
};
export type PlanHostFillObservationOutput = {
    planStepId: string | null;
    fills: PlanHostFillEntry[];
    source: 'plan_reason_host_fill';
};
export declare function buildPlanHostFillObservation(input: {
    planStepId?: string | null;
    fills: PlanHostFillEntry[];
}): ToolObservation;
export declare function resolveLatestPlanHostFill(observations: ToolObservation[], planStepId?: string | null): PlanHostFillObservationOutput | null;
export declare function extractPrimaryFillTextFromHostFills(fills: PlanHostFillEntry[]): string;
export declare function isPlanReasonBeforeHostTool(plan: TaskPlanSnapshot | null | undefined): boolean;
export declare function resolveHostToolsForUpcomingHostStep(plan: TaskPlanSnapshot, scopedHostTools: HostToolDecisionDefinition[]): HostToolDecisionDefinition[];
export declare function resolvePlanHostFillCalls(input: {
    taskPlan: TaskPlanSnapshot;
    observations: ToolObservation[];
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
}): GraphToolCall[];
export declare function hasPlanHostFillForDispatch(input: {
    taskPlan: TaskPlanSnapshot;
    observations: ToolObservation[];
    pendingHostStep: TaskPlanStep;
    hostToolsForPrompt: HostToolDecisionDefinition[];
}): boolean;
export declare function summarizeHostToolsForReasonFillPrompt(tools: HostToolDecisionDefinition[]): string;
