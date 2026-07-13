"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateExecutionReadiness = void 0;
const task_plan_util_1 = require("../main/plan/task-plan.util");
const plan_observation_scope_util_1 = require("../main/plan/plan-observation-scope.util");
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
function ready(reason) {
    return { status: 'ready', reason };
}
function respond(reason, request) {
    return { status: 'respond', reason, request };
}
async function evaluateExecutionReadiness(input) {
    if (input.resumeFromWriteConfirm) {
        return ready('write_confirm_resume');
    }
    const userMessage = input.userMessage.trim();
    const plan = input.taskPlan;
    if (!plan || (0, task_plan_util_1.isPendingPlanAnswerStep)(plan, input.workflowRun)) {
        return ready('plan_answer_or_missing');
    }
    const gatherStep = (0, task_plan_util_1.getPendingPlanToolStep)(plan, input.workflowRun);
    if (!gatherStep || gatherStep.kind !== 'tool') {
        return ready('no_gather_step');
    }
    if (input.scopedTools.length === 0) {
        return respond('unsupported_scope', {
            kind: 'unsupported_scope',
            userMessage,
            payload: { readinessReason: 'no_scoped_tools' },
        });
    }
    const satisfactionObservations = (0, plan_observation_scope_util_1.selectObservationsForPlanToolSatisfaction)(input.observationBuckets);
    const pageContextEntityId = (0, page_context_usage_util_1.resolvePageContextEntityIdForPlanSatisfaction)({
        pageContextUsage: input.pageContextUsage,
        pageContext: input.pageContext,
    });
    if ((0, task_plan_util_1.isPlanToolStepSatisfiedByObservations)({
        step: gatherStep,
        observations: satisfactionObservations,
        scopedTools: input.scopedTools,
        taskPlan: plan,
        skillConfig: input.skillConfig,
        purpose: 'pre_tools_advance',
        pageContextEntityId,
    })) {
        return ready('observation_satisfied');
    }
    return ready('awaiting_tool_decision');
}
exports.evaluateExecutionReadiness = evaluateExecutionReadiness;
//# sourceMappingURL=turn-readiness.util.js.map