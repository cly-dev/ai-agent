"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDraftReviewToolCallsValid = exports.applyDraftReviewToToolCalls = exports.applyDraftReviewToPendingWrite = void 0;
const write_tool_draft_injection_util_1 = require("../tool-engine/write-tool-draft-injection.util");
const message_blocks_util_1 = require("../agent-engine/engine/message/message-blocks.util");
function mergeArguments(base, patch) {
    return Object.assign(Object.assign({}, base), patch);
}
function resolveSubmitTextFromDecision(decision) {
    var _a;
    if ((_a = decision.editedPreviewSerialized) === null || _a === void 0 ? void 0 : _a.trim()) {
        const blocks = (0, message_blocks_util_1.tryParseStoredMessageBlocks)(decision.editedPreviewSerialized);
        const plain = (blocks === null || blocks === void 0 ? void 0 : blocks.length)
            ? (0, message_blocks_util_1.messageBlocksToPlainText)(blocks).trim()
            : decision.editedPreviewSerialized.trim();
        if (plain) {
            return (0, write_tool_draft_injection_util_1.extractSubmitTextFromDraftReply)(plain) || plain;
        }
    }
    return null;
}
function applyDraftReviewToPendingWrite(input) {
    if (input.decision.action !== 'confirm_with_edits') {
        return input.pending;
    }
    let argumentsPatch = Object.assign({}, input.pending.arguments);
    if (input.decision.editedPendingWriteArguments) {
        argumentsPatch = mergeArguments(argumentsPatch, input.decision.editedPendingWriteArguments);
    }
    const submitText = resolveSubmitTextFromDecision(input.decision);
    if (submitText && input.writeTool) {
        argumentsPatch = (0, write_tool_draft_injection_util_1.injectDraftIntoWriteToolArguments)(argumentsPatch, submitText, input.writeTool);
    }
    return Object.assign(Object.assign({}, input.pending), { arguments: argumentsPatch });
}
exports.applyDraftReviewToPendingWrite = applyDraftReviewToPendingWrite;
function applyDraftReviewToToolCalls(input) {
    if (input.decision.action !== 'confirm_with_edits') {
        return input.toolCalls;
    }
    const byName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
    return input.toolCalls.map((call) => {
        var _a;
        const writeTool = (_a = byName.get(call.name)) !== null && _a !== void 0 ? _a : null;
        return Object.assign(Object.assign({}, call), applyDraftReviewToPendingWrite({
            pending: call,
            decision: input.decision,
            writeTool,
        }));
    });
}
exports.applyDraftReviewToToolCalls = applyDraftReviewToToolCalls;
function assertDraftReviewToolCallsValid(input) {
    const byName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
    for (const call of input.toolCalls) {
        const def = byName.get(call.name);
        if (!def) {
            continue;
        }
        if (!(0, write_tool_draft_injection_util_1.satisfiesRequiredWriteToolArgs)(call.arguments, def)) {
            throw new Error(`edited write arguments failed schema validation for ${call.name}`);
        }
    }
}
exports.assertDraftReviewToolCallsValid = assertDraftReviewToolCallsValid;
//# sourceMappingURL=apply-edited-pending-write.util.js.map