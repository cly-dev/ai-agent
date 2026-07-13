"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessGatherToolCandidateReadiness = void 0;
const task_plan_util_1 = require("./task-plan.util");
function isBroadAnalysisGather(taskPlan) {
    if (!taskPlan) {
        return false;
    }
    const deliverable = taskPlan.deliverable;
    if (deliverable !== 'analysis' && deliverable !== 'list') {
        return false;
    }
    const step = taskPlan.steps.find((row) => row.kind === 'tool' && row.phase === 'gather' && row.toolRole === 'read-list');
    return step != null;
}
function assessGatherToolCandidateReadiness(input) {
    const pending = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan, input.workflowRun);
    if (!pending || pending.kind !== 'tool' || pending.phase !== 'gather') {
        return { status: 'ready' };
    }
    if (input.candidates.length === 0) {
        return { status: 'no_candidates', reason: 'empty_candidate_pool' };
    }
    if (isBroadAnalysisGather(input.taskPlan) &&
        input.strategy === 'role_match_all' &&
        input.candidates.length > 0) {
        return {
            status: 'blocked',
            reason: 'broad_analysis_requires_low_friction_list_tool',
        };
    }
    return { status: 'ready' };
}
exports.assessGatherToolCandidateReadiness = assessGatherToolCandidateReadiness;
//# sourceMappingURL=plan-gather-candidate-readiness.util.js.map