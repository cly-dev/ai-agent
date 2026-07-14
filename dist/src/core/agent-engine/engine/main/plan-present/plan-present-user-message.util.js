"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizePlanPresentUserLayer = exports.publishPlanPresentUserLayer = exports.buildPlanPresentUserMessageBlocks = exports.resolvePlanPresentUserMarkdown = exports.sanitizePlanPresentUserMarkdown = void 0;
const message_blocks_util_1 = require("../../message/message-blocks.util");
const llm_output_sanitize_util_1 = require("../../llm-output-sanitize.util");
const plan_draft_summarize_util_1 = require("./plan-draft-summarize.util");
function sanitizePlanPresentUserMarkdown(raw) {
    return (0, message_blocks_util_1.sanitizeSummarizeUserFacingProse)((0, llm_output_sanitize_util_1.sanitizeTextForStorage)(raw)).trim();
}
exports.sanitizePlanPresentUserMarkdown = sanitizePlanPresentUserMarkdown;
function resolvePlanPresentUserMarkdown(input) {
    var _a;
    const fromStream = sanitizePlanPresentUserMarkdown(input.streamedOrLlmMarkdown);
    if (fromStream) {
        return fromStream;
    }
    const submit = (_a = input.machineSubmitText) === null || _a === void 0 ? void 0 : _a.trim();
    return submit ? (0, llm_output_sanitize_util_1.sanitizeLlmFinalOutput)(submit).trim() : '';
}
exports.resolvePlanPresentUserMarkdown = resolvePlanPresentUserMarkdown;
function buildPlanPresentUserMessageBlocks(userMarkdown) {
    const display = userMarkdown.trim();
    return (0, message_blocks_util_1.ensureAtLeastOneTextBlock)(display ? [(0, message_blocks_util_1.textBlock)(display, 'markdown')] : [], display);
}
exports.buildPlanPresentUserMessageBlocks = buildPlanPresentUserMessageBlocks;
function publishPlanPresentUserLayer(deps, input) {
    var _a, _b, _c, _d;
    const draftReply = resolvePlanPresentUserMarkdown({
        streamedOrLlmMarkdown: input.userMarkdown,
        machineSubmitText: input.machineSubmitText,
    });
    if (!draftReply) {
        const existing = (_a = deps.assistantArtifact.peekBlocks(input.sessionId, input.runId)) !== null && _a !== void 0 ? _a : [];
        return {
            draftReply: '',
            blocks: existing,
            serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(existing),
        };
    }
    const merged = buildPlanPresentUserMessageBlocks(draftReply);
    const hasText = merged.some((block) => block.type === 'text' && block.content.trim().length > 0);
    if (!hasText) {
        const existing = (_b = deps.assistantArtifact.peekBlocks(input.sessionId, input.runId)) !== null && _b !== void 0 ? _b : [];
        return {
            draftReply: '',
            blocks: existing,
            serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(existing),
        };
    }
    const turnId = (_d = (_c = input.turnId) !== null && _c !== void 0 ? _c : deps.assistantArtifact.peekTurnId(input.sessionId, input.runId)) !== null && _d !== void 0 ? _d : undefined;
    const blocks = deps.sse.publishAssistantBlocks(input.sessionId, input.runId, merged, { turnId, phase: 'draft' });
    return {
        draftReply,
        blocks,
        serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks),
    };
}
exports.publishPlanPresentUserLayer = publishPlanPresentUserLayer;
function finalizePlanPresentUserLayer(deps, input) {
    const userLayer = (0, plan_draft_summarize_util_1.buildPlanPresentUserLayer)({
        composed: input.machineLayer,
        draftReply: input.userMarkdown,
        taskPlanBeforeFinalize: input.taskPlanBeforeFinalize,
        scopedTools: input.scopedTools,
    });
    const published = publishPlanPresentUserLayer(deps, {
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        userMarkdown: userLayer.draftReply,
        machineSubmitText: userLayer.submitText,
    });
    return {
        draftReply: published.draftReply,
        submitText: userLayer.submitText,
        pendingWriteToolCall: null,
        blocks: published.blocks,
        serialized: published.serialized,
    };
}
exports.finalizePlanPresentUserLayer = finalizePlanPresentUserLayer;
//# sourceMappingURL=plan-present-user-message.util.js.map