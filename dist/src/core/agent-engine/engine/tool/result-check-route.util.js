"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSkillStepPendingToolCalls = exports.resolveResultCheckPlanFallback = void 0;
const task_plan_util_1 = require("../main/plan/task-plan.util");
function resolveResultCheckPlanFallback(input) {
    const { outcome, planAdvance } = input;
    if (outcome.route === 'tools' &&
        outcome.reason === 'paged_gather_resume') {
        return null;
    }
    if (!planAdvance) {
        return null;
    }
    if (planAdvance.route === 'summarize') {
        const superseded = outcome.route === 'tools' ? outcome.pendingToolCalls.length : 0;
        return {
            action: 'summarize',
            authority: 'plan',
            supersededPendingToolCallCount: superseded,
        };
    }
    if (planAdvance.route === 'llm' &&
        planAdvance.reason === 'plan_advance_skill_step') {
        return { action: 'skill_step', authority: 'plan' };
    }
    if (planAdvance.route === 'llm' && outcome.route === 'summarize') {
        return {
            action: 'llm_continue',
            authority: 'plan',
            clearPendingToolCalls: true,
            reason: planAdvance.reason,
        };
    }
    if (planAdvance.route === 'llm' &&
        outcome.route === 'llm' &&
        planAdvance.reason === 'plan_advance_tool_step') {
        return {
            action: 'llm_continue',
            authority: 'plan',
            clearPendingToolCalls: false,
            reason: planAdvance.reason,
        };
    }
    return null;
}
exports.resolveResultCheckPlanFallback = resolveResultCheckPlanFallback;
function resolveSkillStepPendingToolCalls(input) {
    if (!input.taskPlan || input.pendingToolCalls.length === 0) {
        return [];
    }
    const pendingToolStep = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan);
    if (!pendingToolStep) {
        return [];
    }
    return input.pendingToolCalls.filter((call) => (0, task_plan_util_1.toolCallMatchesPendingPlanToolRole)(call, input.taskPlan, input.scopedTools));
}
exports.resolveSkillStepPendingToolCalls = resolveSkillStepPendingToolCalls;
//# sourceMappingURL=result-check-route.util.js.map