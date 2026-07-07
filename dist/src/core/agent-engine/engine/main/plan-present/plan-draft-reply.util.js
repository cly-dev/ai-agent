"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPlanDraftToWriteToolCalls = exports.resolvePlanSubmitTextForWrite = exports.resolvePlanDraftReplyText = exports.resolveLatestPlanDraftReply = exports.buildPlanDraftReplyObservation = exports.PLAN_DRAFT_REPLY_OBSERVATION_NAME = void 0;
const message_blocks_util_1 = require("../../message/message-blocks.util");
const write_tool_draft_injection_util_1 = require("../../../../tool-engine/write-tool-draft-injection.util");
const plan_compose_write_util_1 = require("./plan-compose-write.util");
const task_plan_util_1 = require("../plan/task-plan.util");
const tool_execution_status_util_1 = require("../../tool/tool-execution-status.util");
exports.PLAN_DRAFT_REPLY_OBSERVATION_NAME = 'plan_draft_reply';
function buildPlanDraftReplyObservation(input) {
    var _a, _b;
    const draftReply = input.draftReply.trim();
    const submitText = ((_a = input.submitText) === null || _a === void 0 ? void 0 : _a.trim()) || (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(draftReply);
    return {
        name: exports.PLAN_DRAFT_REPLY_OBSERVATION_NAME,
        output: {
            draftReply,
            submitText,
            planStepId: (_b = input.planStepId) !== null && _b !== void 0 ? _b : null,
            pendingWriteToolCall: input.pendingWriteToolCall
                ? {
                    tool: input.pendingWriteToolCall.name,
                    arguments: input.pendingWriteToolCall.arguments,
                }
                : null,
        },
        quality: 'high',
    };
}
exports.buildPlanDraftReplyObservation = buildPlanDraftReplyObservation;
function resolveLatestPlanDraftReply(observations) {
    var _a;
    for (let i = observations.length - 1; i >= 0; i -= 1) {
        const row = observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        if ((_a = output === null || output === void 0 ? void 0 : output.draftReply) === null || _a === void 0 ? void 0 : _a.trim()) {
            return output;
        }
    }
    return null;
}
exports.resolveLatestPlanDraftReply = resolveLatestPlanDraftReply;
function resolvePlanDraftReplyText(input) {
    var _a;
    for (let i = input.observations.length - 1; i >= 0; i -= 1) {
        const row = input.observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        const text = (_a = output === null || output === void 0 ? void 0 : output.draftReply) === null || _a === void 0 ? void 0 : _a.trim();
        if (text) {
            return text;
        }
    }
    if (input.artifactBlocks && input.artifactBlocks.length > 0) {
        const plain = (0, message_blocks_util_1.messageBlocksToPlainText)(input.artifactBlocks).trim();
        return plain.length > 0 ? plain : null;
    }
    return null;
}
exports.resolvePlanDraftReplyText = resolvePlanDraftReplyText;
function resolvePlanSubmitTextForWrite(input) {
    var _a, _b, _c, _d;
    for (let i = input.observations.length - 1; i >= 0; i -= 1) {
        const row = input.observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== exports.PLAN_DRAFT_REPLY_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        const submitText = (_a = output === null || output === void 0 ? void 0 : output.submitText) === null || _a === void 0 ? void 0 : _a.trim();
        if (submitText) {
            return submitText;
        }
        const draftReply = (_b = output === null || output === void 0 ? void 0 : output.draftReply) === null || _b === void 0 ? void 0 : _b.trim();
        if (draftReply) {
            return (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(draftReply);
        }
    }
    for (let i = input.observations.length - 1; i >= 0; i -= 1) {
        const row = input.observations[i];
        if ((row === null || row === void 0 ? void 0 : row.name) !== plan_compose_write_util_1.PLAN_COMPOSE_WRITE_OBSERVATION_NAME) {
            continue;
        }
        const output = row.output;
        const toolName = (_c = output === null || output === void 0 ? void 0 : output.tool) === null || _c === void 0 ? void 0 : _c.trim();
        const args = output === null || output === void 0 ? void 0 : output.arguments;
        if (!toolName || !args || typeof args !== 'object' || Array.isArray(args)) {
            continue;
        }
        const writeTool = (_d = input.scopedTools) === null || _d === void 0 ? void 0 : _d.find((tool) => tool.name === toolName);
        if (writeTool) {
            const fromArgs = (0, write_tool_draft_injection_util_1.extractSubmitTextFromWriteArguments)(args, writeTool);
            if (fromArgs && (0, write_tool_draft_injection_util_1.isUsablePlanDraftSubmitText)(fromArgs)) {
                return fromArgs.trim();
            }
        }
    }
    const draft = resolvePlanDraftReplyText(input);
    return draft ? (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(draft) : null;
}
exports.resolvePlanSubmitTextForWrite = resolvePlanSubmitTextForWrite;
function applyPlanDraftToWriteToolCalls(toolCalls, taskPlan, scopedTools, submitText) {
    const text = submitText === null || submitText === void 0 ? void 0 : submitText.trim();
    if (!text || !(0, task_plan_util_1.isPlanWriteToolStep)((0, task_plan_util_1.getPendingPlanToolStep)(taskPlan))) {
        return toolCalls;
    }
    return toolCalls.map((call) => {
        const def = scopedTools.find((tool) => tool.name === call.name);
        if (!def || !(0, tool_execution_status_util_1.isMutationTool)(def.agentMetadata)) {
            return call;
        }
        return Object.assign(Object.assign({}, call), { arguments: (0, write_tool_draft_injection_util_1.injectDraftIntoWriteToolArguments)(call.arguments, text, def) });
    });
}
exports.applyPlanDraftToWriteToolCalls = applyPlanDraftToWriteToolCalls;
//# sourceMappingURL=plan-draft-reply.util.js.map