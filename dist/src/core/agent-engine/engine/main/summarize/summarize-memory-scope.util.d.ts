import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import type { SplitToolObservationsInput } from '../../graph-tool-observations.util';
import type { SummarizeMemoryScopeMeta } from '../../observation-format.util';
import type { ToolObservation } from '../types/agent-engine.types';
import { type PlanRunContext } from '../plan/plan-observation-scope.util';
import { type PlanScopedTool } from '../plan/task-plan.util';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
export type SummarizeMemoryPrimarySource = 'current_run' | 'working_memory' | 'both' | 'none';
export type SummarizeMemoryScopeReason = 'current_run_gather_complete' | 'follow_up_working_memory' | 'fresh_topic_current_run_only' | 'replan_requires_fresh_gather' | 'working_memory_only' | 'current_run_only' | 'both_buckets' | 'filter_miss' | 'empty' | 'chitchat_no_tool_memory';
export type SummarizeMemoryScope = {
    primarySource: SummarizeMemoryPrimarySource;
    workingMemory: ToolObservation[];
    currentRun: ToolObservation[];
    reason: SummarizeMemoryScopeReason;
    filterMiss?: boolean;
};
export type ResolveSummarizeMemoryScopeInput = {
    split: SplitToolObservationsInput;
    plan?: TaskPlanSnapshot | null;
    scopedTools?: PlanScopedTool[];
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
    planRunContext?: PlanRunContext;
};
export declare function resolveSummarizeMemoryScope(input: ResolveSummarizeMemoryScopeInput): SummarizeMemoryScope;
export declare function applySummarizeMemoryScope(split: SplitToolObservationsInput, scope: SummarizeMemoryScope): SplitToolObservationsInput & {
    memoryScope: SummarizeMemoryScopeMeta;
};
