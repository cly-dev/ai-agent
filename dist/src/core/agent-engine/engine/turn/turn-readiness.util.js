"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeSessionObservationsForReadiness = exports.evaluateExecutionReadiness = void 0;
const task_plan_util_1 = require("../main/plan/task-plan.util");
const plan_observation_scope_util_1 = require("../main/plan/plan-observation-scope.util");
const page_context_usage_util_1 = require("../../../host-bridge/page-context-usage.util");
const turn_readiness_llm_util_1 = require("./turn-readiness-llm.util");
function ready(reason) {
    return { status: 'ready', reason };
}
function respond(reason, request) {
    return { status: 'respond', reason, request };
}
async function evaluateExecutionReadiness(input) {
    var _a, _b;
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
    const requiredFields = (0, task_plan_util_1.listBusinessFieldsForPlanGatherStep)(gatherStep, input.scopedTools);
    if (requiredFields.length === 0) {
        return ready('no_business_fields');
    }
    if (!input.llmService ||
        !input.promptRegistry ||
        !input.scope) {
        return ready('slot_llm_unavailable');
    }
    const slotResult = await (0, turn_readiness_llm_util_1.evaluateReadinessSlotsWithLlm)({
        llmService: input.llmService,
        promptRegistry: input.promptRegistry,
        scope: input.scope,
        userMessage,
        planGoal: plan.goal,
        currentObjective: plan.currentObjective,
        requiredFields,
        sessionObservationSummary: (_a = input.sessionObservationSummary) !== null && _a !== void 0 ? _a : null,
        pageContext: (_b = input.pageContext) !== null && _b !== void 0 ? _b : null,
    });
    if (slotResult.ready) {
        return ready('slots_ready');
    }
    const missingFields = (0, turn_readiness_llm_util_1.normalizeMissingFieldsFromLlm)(slotResult.missingFields);
    if (missingFields.length === 0) {
        return ready('slots_ready_empty_missing');
    }
    return respond('missing_business_fields', {
        kind: 'clarification',
        userMessage,
        payload: {
            missingFields,
            planStepId: gatherStep.id,
            toolRole: gatherStep.toolRole,
            readinessReason: 'missing_business_fields',
        },
    });
}
exports.evaluateExecutionReadiness = evaluateExecutionReadiness;
function summarizeSessionObservationsForReadiness(observations, maxItems = 3) {
    if (observations.length === 0) {
        return null;
    }
    const tail = observations.slice(-maxItems);
    const lines = tail.map((row) => {
        var _a;
        const args = (_a = row.llmPayload) === null || _a === void 0 ? void 0 : _a.args;
        const argsText = args && typeof args === 'object'
            ? JSON.stringify(args)
            : '';
        return `- tool=${row.name}${argsText ? ` args=${argsText}` : ''}`;
    });
    return lines.join('\n');
}
exports.summarizeSessionObservationsForReadiness = summarizeSessionObservationsForReadiness;
//# sourceMappingURL=turn-readiness.util.js.map