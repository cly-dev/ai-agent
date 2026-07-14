import type { PlanToolCandidateStrategy } from './plan-tool-candidates.util';
import type { PlanToolCandidateTool } from './plan-tool-candidates.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import type { WorkflowRunState } from '../../../../workflow/workflow.types';
export type GatherToolCandidateReadiness = {
    status: 'ready';
} | {
    status: 'no_candidates';
    reason: 'empty_candidate_pool';
} | {
    status: 'blocked';
    reason: 'broad_analysis_requires_low_friction_list_tool';
};
export declare function assessGatherToolCandidateReadiness(input: {
    taskPlan?: TaskPlanSnapshot | null;
    workflowRun?: WorkflowRunState | null;
    candidates: PlanToolCandidateTool[];
    strategy: PlanToolCandidateStrategy | null;
}): GatherToolCandidateReadiness;
