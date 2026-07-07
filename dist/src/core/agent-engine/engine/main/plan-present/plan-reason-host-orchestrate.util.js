"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPlanReasonHostFill = void 0;
const host_tool_fill_alignment_util_1 = require("../host-tool/host-tool-fill-alignment.util");
const task_plan_util_1 = require("../plan/task-plan.util");
const plan_draft_reply_util_1 = require("./plan-draft-reply.util");
const plan_host_fill_util_1 = require("./plan-host-fill.util");
const plan_reason_host_machine_prompt_util_1 = require("./plan-reason-host-machine-prompt.util");
const plan_reason_host_machine_layer_util_1 = require("./plan-reason-host-machine-layer.util");
const plan_reason_host_user_message_util_1 = require("./plan-reason-host-user-message.util");
async function runPlanReasonHostFill(deps, input) {
    var _a, _b, _c, _d;
    const { userMessage, mergedObservation, toolObservations, promptMessages, sessionId, runId, scope, taskPlan, scopedHostTools, pageContext, } = input;
    const reasonStep = (0, task_plan_util_1.getPendingPlanStep)(taskPlan);
    const reasonStepId = (_a = reasonStep === null || reasonStep === void 0 ? void 0 : reasonStep.id) !== null && _a !== void 0 ? _a : null;
    const planContext = (0, host_tool_fill_alignment_util_1.buildPlanContextForSummarize)(taskPlan, toolObservations);
    const hostTools = (0, plan_host_fill_util_1.resolveHostToolsForUpcomingHostStep)(taskPlan, scopedHostTools);
    const planUserMessage = (0, task_plan_util_1.resolveSummarizeUserMessageForPlan)(userMessage, taskPlan);
    const observationPayload = (0, plan_reason_host_machine_prompt_util_1.resolveReasonHostFillObservationPayload)({
        mergedObservation,
        toolObservations,
    });
    const emptyResult = () => {
        const published = (0, plan_reason_host_user_message_util_1.publishPlanReasonHostUserLayer)(deps, {
            sessionId,
            runId,
            userMarkdown: '',
        });
        return {
            serialized: published.serialized,
            draftReply: '',
            submitText: '',
            hostFillObservation: (0, plan_host_fill_util_1.buildPlanHostFillObservation)({
                planStepId: reasonStepId,
                fills: [],
            }),
            draftReplyObservation: (0, plan_draft_reply_util_1.buildPlanDraftReplyObservation)({
                draftReply: '',
                submitText: '',
                planStepId: reasonStepId,
            }),
        };
    };
    if (hostTools.length === 0) {
        deps.logger.warn(`plan reason host fill skipped: no host tools for upcoming step runId=${runId}`);
        return emptyResult();
    }
    const agentPrompts = promptMessages.filter((message) => message.role === 'system' && message.content.includes('<agent_prompt>'));
    const allowedToolNames = new Set(hostTools.map((tool) => tool.name));
    const afterFinalize = (0, task_plan_util_1.finalizePlanAfterSummarize)(taskPlan);
    const upcomingHostStep = afterFinalize
        ? (0, task_plan_util_1.getPendingPlanHostToolStep)(afterFinalize)
        : null;
    if (!upcomingHostStep) {
        deps.logger.warn(`plan reason host fill skipped: host tools resolved but no pending host step runId=${runId}`);
        return emptyResult();
    }
    const turnId = (_c = (_b = input.turnId) !== null && _b !== void 0 ? _b : deps.assistantArtifact.peekTurnId(sessionId, runId)) !== null && _c !== void 0 ? _c : runId;
    const machineContext = (0, plan_reason_host_machine_layer_util_1.buildPlanReasonHostMachineContext)({
        agentPrompts,
        userMessage: planUserMessage,
        planContext,
        hostTools,
        splitObservationsText: observationPayload.splitObservationsText,
        serializedOutput: observationPayload.serializedOutput,
        allowedToolNames,
        pageContext,
        sessionId,
        runId,
        turnId,
        scope,
        hostStepId: upcomingHostStep.id,
        reasonStepId,
    });
    const machineResult = await (0, plan_reason_host_machine_layer_util_1.runPlanReasonHostMachineLayer)(deps, machineContext);
    const { fills } = machineResult;
    const submitText = (0, plan_host_fill_util_1.extractPrimaryFillTextFromHostFills)(fills);
    const userMarkdown = (0, plan_reason_host_user_message_util_1.buildPlanReasonHostUserMarkdown)({
        fills,
        stepObjective: (_d = reasonStep === null || reasonStep === void 0 ? void 0 : reasonStep.objective) !== null && _d !== void 0 ? _d : null,
    });
    const published = (0, plan_reason_host_user_message_util_1.publishPlanReasonHostUserLayer)(deps, {
        sessionId,
        runId,
        turnId,
        userMarkdown,
    });
    return {
        serialized: published.serialized,
        draftReply: published.draftReply,
        submitText,
        hostFillObservation: (0, plan_host_fill_util_1.buildPlanHostFillObservation)({
            planStepId: reasonStepId,
            fills,
        }),
        draftReplyObservation: (0, plan_draft_reply_util_1.buildPlanDraftReplyObservation)({
            draftReply: published.draftReply,
            submitText,
            planStepId: reasonStepId,
        }),
        hostToolStreamObservation: machineResult.hostToolStreamObservation,
        hostToolDispatchObservations: machineResult.hostToolDispatchObservations,
    };
}
exports.runPlanReasonHostFill = runPlanReasonHostFill;
//# sourceMappingURL=plan-reason-host-orchestrate.util.js.map