"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentGraphSummarizeHelpers = exports.isLowQualityToolObservation = exports.buildSummarizeObservationFromState = exports.buildPendingPlanSummaryObservation = exports.assessObservationQualityForResume = exports.assessObservationQuality = void 0;
const observation_util_1 = require("./observation.util");
const stream_util_1 = require("./stream.util");
const plan_reason_host_orchestrate_util_1 = require("../../plan-present/plan-reason-host-orchestrate.util");
var observation_util_2 = require("./observation.util");
Object.defineProperty(exports, "assessObservationQuality", { enumerable: true, get: function () { return observation_util_2.assessObservationQuality; } });
Object.defineProperty(exports, "assessObservationQualityForResume", { enumerable: true, get: function () { return observation_util_2.assessObservationQualityForResume; } });
Object.defineProperty(exports, "buildPendingPlanSummaryObservation", { enumerable: true, get: function () { return observation_util_2.buildPendingPlanSummaryObservation; } });
Object.defineProperty(exports, "buildSummarizeObservationFromState", { enumerable: true, get: function () { return observation_util_2.buildSummarizeObservationFromState; } });
Object.defineProperty(exports, "isLowQualityToolObservation", { enumerable: true, get: function () { return observation_util_2.isLowQualityToolObservation; } });
function createAgentGraphSummarizeHelpers(deps) {
    return {
        isLowQualityToolObservation: observation_util_1.isLowQualityToolObservation,
        assessObservationQuality: observation_util_1.assessObservationQuality,
        assessObservationQualityForResume: observation_util_1.assessObservationQualityForResume,
        resolveToolStepCode: observation_util_1.resolveToolStepCode,
        buildSummarizeObservationFromState: observation_util_1.buildSummarizeObservationFromState,
        buildPendingPlanSummaryObservation: observation_util_1.buildPendingPlanSummaryObservation,
        resolveLlmCompletionAfterTools: observation_util_1.resolveLlmCompletionAfterTools,
        buildDirectReplyObservation: observation_util_1.buildDirectReplyObservation,
        summarizeWriteConfirmResume: (input) => (0, stream_util_1.summarizeWriteConfirmResume)(deps, input),
        summarizeToolOutputForUser: stream_util_1.summarizeToolOutputForUser.bind(null, deps),
        summarizeDirectUserMessage: stream_util_1.summarizeDirectUserMessage.bind(null, deps),
        summarizeClarificationRequest: stream_util_1.summarizeClarificationRequest.bind(null, deps),
        summarizeSkillIntentMismatch: stream_util_1.summarizeSkillIntentMismatch.bind(null, deps),
        summarizeDirectLlmReply: stream_util_1.summarizeDirectLlmReply.bind(null, deps),
        summarizePlanPresentWithPendingWrite: stream_util_1.summarizePlanPresentWithPendingWrite.bind(null, deps),
        runPlanReasonHostFill: (userMessage, mergedObservation, toolObservations, promptMessages, sessionId, runId, scope, taskPlan, scopedHostTools, pageContext, turnId) => (0, plan_reason_host_orchestrate_util_1.runPlanReasonHostFill)(deps, {
            userMessage,
            mergedObservation,
            toolObservations,
            promptMessages,
            sessionId,
            runId,
            turnId,
            scope,
            taskPlan,
            scopedHostTools,
            pageContext,
        }),
        resolveSummarizeStepName: observation_util_1.resolveSummarizeStepName,
        resolveSummarizeStepMeta: observation_util_1.resolveSummarizeStepMeta,
    };
}
exports.createAgentGraphSummarizeHelpers = createAgentGraphSummarizeHelpers;
//# sourceMappingURL=summarize.helpers.js.map