import type { ToolDecisionRole } from '../../../../tool-engine/tool-decision-role.enum';
import type { WorkflowNodeDef, WorkflowRunState } from '../../../../workflow/workflow.types';
import { type PlanScopedTool } from './task-plan.util';
import type { TaskPlanSnapshot } from './task-plan.types';
export type PlanToolCandidateTool = PlanScopedTool & {
    inputSchema?: unknown;
    schema?: unknown;
};
export type PlanToolCandidateStrategy = 'no_gather_step' | 'host_or_blocked' | 'plan_pinned_tool' | 'single_role_match' | 'broad_list_preferred' | 'list_operation_preferred' | 'role_match_all' | 'fallback_scoped';
export type PlanToolCandidateResolveResult<T extends PlanToolCandidateTool> = {
    candidates: T[];
    strategy: PlanToolCandidateStrategy;
    planStepId: string | null;
    toolRole: ToolDecisionRole | null;
};
export type PlanToolRequiredParamGroup = {
    toolNames: string[];
    fields: string[];
};
export declare function listUserFacingRequiredParamsForTool(tool: PlanToolCandidateTool): string[];
export declare function groupPlanToolsByRequiredParams<T extends PlanToolCandidateTool>(tools: T[]): PlanToolRequiredParamGroup[];
export declare function resolvePlanToolCandidates<T extends PlanToolCandidateTool>(input: {
    scopedTools: T[];
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanToolCandidateResolveResult<T>;
export declare function resolvePlanStepToolCandidatesFromState<T extends PlanToolCandidateTool>(state: {
    planStepToolCandidates?: T[] | null;
    planStepToolCandidateStrategy?: PlanToolCandidateStrategy | null;
    scopedTools: T[];
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    workflowNodeDefs?: WorkflowNodeDef[] | null;
}): PlanToolCandidateResolveResult<T>;
