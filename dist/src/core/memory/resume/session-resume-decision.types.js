"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeDecisionKeepsActiveTask = exports.goalStrategyFromResumeDecision = exports.defaultFreshResumeDecision = void 0;
function defaultFreshResumeDecision() {
    return { action: 'fresh', goalStrategy: 'use_turn_message' };
}
exports.defaultFreshResumeDecision = defaultFreshResumeDecision;
function goalStrategyFromResumeDecision(decision) {
    if (decision.action === 'abandon_and_fresh') {
        return 'use_turn_message';
    }
    if (decision.action === 'resume' ||
        decision.action === 'fresh_same_goal') {
        return 'inherit_active_task';
    }
    return decision.goalStrategy;
}
exports.goalStrategyFromResumeDecision = goalStrategyFromResumeDecision;
function resumeDecisionKeepsActiveTask(decision) {
    return (decision.action === 'resume' || decision.action === 'fresh_same_goal');
}
exports.resumeDecisionKeepsActiveTask = resumeDecisionKeepsActiveTask;
//# sourceMappingURL=session-resume-decision.types.js.map