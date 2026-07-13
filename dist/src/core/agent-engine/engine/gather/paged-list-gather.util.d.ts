import type { LlmService } from '../../../llm/llm.service';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import type { ExecuteToolCallsRoundResult } from '../main/runtime/agent-tool-runtime.util';
import type { AgentEngineTool, AgentRunStep, GraphToolCall, ToolObservation } from '../main/types/agent-engine.types';
import type { TaskPlanSnapshot } from '../main/plan/task-plan.types';
import type { PlanScopedTool } from '../main/plan/task-plan.util';
import type { RunMetricsAccumulator } from '../run-metrics.util';
export type RunToolRoundFn = (toolCalls: GraphToolCall[], observations: ToolObservation[], steps: AgentRunStep[]) => Promise<ExecuteToolCallsRoundResult>;
export type PagedGatherHttpBudget = {
    used: number;
    max: number;
};
export type PagedGatherLlmContext = {
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    currentObjective?: string;
    runMetrics?: RunMetricsAccumulator;
    runId?: number;
    sessionId?: string;
    iteration?: number;
    onDebugLog?: (message: string) => void;
};
export type ExpandPagedListGatherInput = {
    round: ExecuteToolCallsRoundResult;
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: AgentEngineTool[];
    runRound: RunToolRoundFn;
    gatherLlm: PagedGatherLlmContext;
    httpBudget?: PagedGatherHttpBudget;
    onProgress?: (message: string) => void;
};
export type ResumePagedListGatherInput = {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: AgentEngineTool[];
    observations: ToolObservation[];
    steps: AgentRunStep[];
    runRound: RunToolRoundFn;
    gatherLlm: PagedGatherLlmContext;
    httpBudget?: PagedGatherHttpBudget;
    onProgress?: (message: string) => void;
};
export declare function findIncompletePagedGatherTarget(input: {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: PlanScopedTool[];
    observations: ToolObservation[];
}): {
    observationIndex: number;
    toolName: string;
} | null;
export type PagedGatherResumeRouteInput = {
    pendingToolCalls: GraphToolCall[];
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: PlanScopedTool[];
    observations: ToolObservation[];
};
export declare function shouldResumePagedGather(input: {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: PlanScopedTool[];
    observations: ToolObservation[];
}): boolean;
export type PagedGatherResumeKind = 'pagination' | 'map_summary';
export declare function resolvePagedGatherResumeKind(input: {
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: PlanScopedTool[];
    observations: ToolObservation[];
}): PagedGatherResumeKind | null;
export declare function resolvePagedGatherResumeRoute(input: PagedGatherResumeRouteInput): {
    supersededPendingToolCallCount: number;
} | null;
export declare function shouldRouteGraphToTools(input: {
    pendingToolCalls: GraphToolCall[];
    taskPlan?: TaskPlanSnapshot | null;
    scopedTools: PlanScopedTool[];
    observations: ToolObservation[];
}): boolean;
export declare function resumeIncompletePagedGather(input: ResumePagedListGatherInput): Promise<ExecuteToolCallsRoundResult | null>;
export declare function expandPagedListGather(input: ExpandPagedListGatherInput): Promise<ExecuteToolCallsRoundResult>;
