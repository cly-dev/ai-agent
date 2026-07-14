"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldAbandonActiveTaskForFreshPlan = exports.resolvePlanTurnAxes = void 0;
const session_resume_decision_types_1 = require("../../../../memory/resume/session-resume-decision.types");
const ACTIVE_TASK_STATUSES = new Set(['in_progress', 'awaiting_confirmation']);
function readActiveTaskSummary(memory) {
    var _a;
    return (_a = memory === null || memory === void 0 ? void 0 : memory.activeTask) !== null && _a !== void 0 ? _a : null;
}
function resolvePlanTurnAxes(input) {
    var _a;
    const turnMessage = input.turnMessage.trim();
    const active = readActiveTaskSummary(input.sessionWorkingMemory);
    const canInherit = input.goalStrategy === 'inherit_active_task' &&
        ((_a = input.contract) === null || _a === void 0 ? void 0 : _a.taskKind) === 'orchestrated_read' &&
        input.contract.plan.allowSessionResume !== false &&
        active != null &&
        ACTIVE_TASK_STATUSES.has(active.status) &&
        active.goal.trim().length > 0 &&
        active.originalUserRequest.trim().length > 0;
    if (canInherit) {
        return {
            turnMessage,
            goal: active.goal.trim(),
            originalUserRequest: active.originalUserRequest.trim(),
            inheritedFromActiveTask: true,
            goalStrategy: input.goalStrategy,
        };
    }
    const fallbackGoal = turnMessage.length > 0 ? turnMessage : 'Complete the user request';
    return {
        turnMessage,
        goal: fallbackGoal,
        originalUserRequest: fallbackGoal,
        inheritedFromActiveTask: false,
        goalStrategy: 'use_turn_message',
    };
}
exports.resolvePlanTurnAxes = resolvePlanTurnAxes;
function shouldAbandonActiveTaskForFreshPlan(input) {
    if (input.resumeDecision.action === 'abandon_and_fresh') {
        return false;
    }
    if ((0, session_resume_decision_types_1.resumeDecisionKeepsActiveTask)(input.resumeDecision)) {
        return false;
    }
    if (!input.contract.plan.abandonActiveTaskOnFreshPlan) {
        return false;
    }
    return input.resumeDecision.action === 'fresh';
}
exports.shouldAbandonActiveTaskForFreshPlan = shouldAbandonActiveTaskForFreshPlan;
//# sourceMappingURL=plan-turn-context.util.js.map