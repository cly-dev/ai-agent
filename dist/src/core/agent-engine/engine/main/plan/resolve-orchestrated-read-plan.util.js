"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOrchestratedReadPlanResult = void 0;
const task_plan_util_1 = require("./task-plan.util");
function applyPlanTurnAxes(plan, axes) {
    return Object.assign(Object.assign({}, plan), { goal: axes.goal, originalUserRequest: axes.originalUserRequest });
}
function resolveOrchestratedReadPlanResult(input) {
    const { planInput, deliverable, planAxes } = input;
    const template = (0, task_plan_util_1.buildOrchestratedTemplatePlanResult)({
        userMessage: planAxes.turnMessage,
        scopedToolSummaries: planInput.scopedToolSummaries,
        deliverable,
    });
    if (template) {
        return Object.assign(Object.assign({}, template), { plan: applyPlanTurnAxes(template.plan, planAxes) });
    }
    const rulePlan = (0, task_plan_util_1.buildTaskPlan)({
        userMessage: planAxes.turnMessage,
        scopedToolSummaries: planInput.scopedToolSummaries,
    });
    return {
        plan: applyPlanTurnAxes(rulePlan, planAxes),
        method: rulePlan.source,
        llmFallbackReason: 'orchestrated_read_rule_fallback',
    };
}
exports.resolveOrchestratedReadPlanResult = resolveOrchestratedReadPlanResult;
//# sourceMappingURL=resolve-orchestrated-read-plan.util.js.map