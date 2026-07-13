"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planAwaitingPagedGatherCompletion = exports.shouldExpandPlanPagedGather = exports.isReadListGatherToolStep = exports.resolvePagedGatherSummarizeObjective = void 0;
const pagination_1 = require("../../../mcp-utils/pagination");
const task_plan_util_1 = require("../main/plan/task-plan.util");
function resolvePagedGatherSummarizeObjective(taskPlan) {
    if (!taskPlan) {
        return undefined;
    }
    const pending = new Set(taskPlan.pendingStepIds);
    const summarizeStep = taskPlan.steps.find((step) => pending.has(step.id) &&
        step.kind === 'summarize' &&
        (step.phase === 'analyze' || step.phase === 'answer'));
    return summarizeStep === null || summarizeStep === void 0 ? void 0 : summarizeStep.objective;
}
exports.resolvePagedGatherSummarizeObjective = resolvePagedGatherSummarizeObjective;
function isReadListGatherToolStep(input) {
    if (!input.taskPlan) {
        return false;
    }
    const pendingStep = (0, task_plan_util_1.getPendingPlanToolStep)(input.taskPlan);
    if (!(0, task_plan_util_1.planGatherRequiresFullFetch)(pendingStep)) {
        return false;
    }
    if ((pendingStep === null || pendingStep === void 0 ? void 0 : pendingStep.phase) !== 'gather') {
        return false;
    }
    if (pendingStep.toolRole && pendingStep.toolRole !== 'read-list') {
        return false;
    }
    const tool = input.scopedTools.find((row) => row.name === input.toolName);
    if (!tool) {
        return false;
    }
    const toolRole = (0, task_plan_util_1.resolveScopedToolRoleForPlan)(tool);
    if (toolRole !== 'read-list') {
        return false;
    }
    if (pendingStep.toolRole && pendingStep.toolRole !== toolRole) {
        return false;
    }
    return true;
}
exports.isReadListGatherToolStep = isReadListGatherToolStep;
function shouldExpandPlanPagedGather(input) {
    if (!isReadListGatherToolStep({
        taskPlan: input.taskPlan,
        toolName: input.toolName,
        scopedTools: input.scopedTools,
    })) {
        return false;
    }
    return (0, pagination_1.observationNeedsPagedFetch)({
        output: input.output,
        args: input.args,
        llmPayload: input.llmPayload,
    });
}
exports.shouldExpandPlanPagedGather = shouldExpandPlanPagedGather;
function planAwaitingPagedGatherCompletion(taskPlan) {
    if (!taskPlan) {
        return false;
    }
    const pendingStep = (0, task_plan_util_1.getPendingPlanToolStep)(taskPlan);
    return ((pendingStep === null || pendingStep === void 0 ? void 0 : pendingStep.phase) === 'gather' &&
        (0, task_plan_util_1.planGatherRequiresFullFetch)(pendingStep));
}
exports.planAwaitingPagedGatherCompletion = planAwaitingPagedGatherCompletion;
//# sourceMappingURL=plan-paged-gather.util.js.map