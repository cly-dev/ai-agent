import type { AgentRunStep, GraphToolCall, ToolObservation } from '../main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import { type PlanScopedTool } from '../main/plan/task-plan.util';
import { type PagedGatherResumeKind } from '../gather/paged-list-gather.util';
import { type PlanObservationBuckets } from '../main/plan/plan-observation-scope.util';
import { type ToolCallLike } from './tool-call-dedupe.util';
import { type ToolErrorDisposition, type ToolExecutionStatus } from './tool-execution-status.util';
export type ResultCheckPhase = 'pre_tools' | 'post_tools';
export type ResultCheckRoute = 'tools' | 'llm' | 'summarize' | 'expand_tools';
export type ResultCheckOutcome = {
    phase: ResultCheckPhase;
    route: ResultCheckRoute;
    reason: string;
    pendingToolCalls: GraphToolCall[];
    duplicateSkipCalls: GraphToolCall[];
    supersededPendingToolCallCount?: number;
    pagedGatherResumeKind?: PagedGatherResumeKind;
};
export type ToolRoundMeta = {
    toolCalls: GraphToolCall[];
    executionStatuses: ToolExecutionStatus[];
    errorDispositions: ToolErrorDisposition[];
    roundObservationIndices: number[];
};
export declare function inferResultCheckPhase(state: {
    pendingToolCalls: GraphToolCall[];
    lastToolRoundMeta?: ToolRoundMeta | null;
}): ResultCheckPhase;
export declare function resolvePreToolsResultCheck(input: {
    pendingToolCalls: GraphToolCall[];
    steps: AgentRunStep[];
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools?: PlanScopedTool[];
    observationBuckets: PlanObservationBuckets;
    skillConfig?: unknown;
    pageContextEntityId?: string | null;
}): ResultCheckOutcome;
export declare function resolvePostToolsResultCheck(input: {
    userMessage: string;
    observations: ToolObservation[];
    lastToolRoundMeta: ToolRoundMeta;
    scopedTools: Array<{
        name: string;
        agentMetadata: unknown;
        inputSchema: unknown;
        description?: string;
        responseProfile?: unknown;
    }>;
    taskPlan?: TaskPlanSnapshot | null;
    skillConfig?: unknown;
    skillApplied?: boolean;
    hasExpandedOnce: boolean;
    iteration: number;
    totalAllowedToolCount: number;
    isLowQualityLastObservation: boolean;
    writeConfirmResume?: boolean;
}): ResultCheckOutcome;
export declare function resolveSummaryObservationForCheck(input: {
    reason: string;
    observations: ToolObservation[];
    savedRoundMeta?: ToolRoundMeta | null;
    mergedObservation: ToolObservation | null;
}): ToolObservation | null;
export declare function buildDuplicateSkipToolSteps(calls: ToolCallLike[], existingSteps: AgentRunStep[], reason: string): AgentRunStep[];
