import type { PlanToolCandidateStrategy } from './plan-tool-candidates.util';
import type { PlanToolCandidateTool } from './plan-tool-candidates.util';
import type { TaskPlanSnapshot } from './task-plan.types';
import { getPendingPlanToolStep } from './task-plan.util';
import type { WorkflowRunState } from '../../../../workflow/workflow.types';

export type GatherToolCandidateReadiness =
  | { status: 'ready' }
  | { status: 'no_candidates'; reason: 'empty_candidate_pool' }
  | {
      status: 'blocked';
      reason: 'broad_analysis_requires_low_friction_list_tool';
    };

function isBroadAnalysisGather(
  taskPlan: TaskPlanSnapshot | null | undefined,
): boolean {
  if (!taskPlan) {
    return false;
  }
  const deliverable = taskPlan.deliverable;
  if (deliverable !== 'analysis' && deliverable !== 'list') {
    return false;
  }
  const step = taskPlan.steps.find(
    (row) => row.kind === 'tool' && row.phase === 'gather' && row.toolRole === 'read-list',
  );
  return step != null;
}

/**
 * gather 步工具候选面就绪检查：无候选或 analysis 仅高摩擦必填工具时阻断，避免 param_gate 假澄清。
 */
export function assessGatherToolCandidateReadiness(input: {
  taskPlan?: TaskPlanSnapshot | null;
  workflowRun?: WorkflowRunState | null;
  candidates: PlanToolCandidateTool[];
  strategy: PlanToolCandidateStrategy | null;
}): GatherToolCandidateReadiness {
  const pending = getPendingPlanToolStep(input.taskPlan, input.workflowRun);
  if (!pending || pending.kind !== 'tool' || pending.phase !== 'gather') {
    return { status: 'ready' };
  }

  if (input.candidates.length === 0) {
    return { status: 'no_candidates', reason: 'empty_candidate_pool' };
  }

  if (
    isBroadAnalysisGather(input.taskPlan) &&
    input.strategy === 'role_match_all' &&
    input.candidates.length > 0
  ) {
    return {
      status: 'blocked',
      reason: 'broad_analysis_requires_low_friction_list_tool',
    };
  }

  return { status: 'ready' };
}
