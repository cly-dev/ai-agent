"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDraftReviewToolCallsValid = exports.applyDraftReviewToToolCalls = exports.applyDraftReviewToPendingWrite = void 0;
const write_tool_draft_injection_util_1 = require("../tool-engine/write-tool-draft-injection.util");
const message_blocks_util_1 = require("../agent-engine/engine/message/message-blocks.util");
const resolve_write_draft_edit_policy_util_1 = require("./resolve-write-draft-edit-policy.util");
const sanitize_draft_review_patch_util_1 = require("./sanitize-draft-review-patch.util");
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
function normalizeDecisionForPolicy(input) {
    if (input.decision.action !== 'confirm_with_edits') {
        return input.decision;
    }
    const policy = (0, resolve_write_draft_edit_policy_util_1.resolveWriteDraftEditPolicyForToolCall)({
        writeTool: input.writeTool,
        arguments: input.pending.arguments,
    });
    if (!policy) {
        return input.decision;
    }
    let editedPendingWriteArguments = input.decision.editedPendingWriteArguments;
    if (!policy.allowArgumentsPatch) {
        editedPendingWriteArguments = null;
    }
    else if (editedPendingWriteArguments) {
        const sanitized = (0, sanitize_draft_review_patch_util_1.sanitizeDraftReviewArgumentsPatch)(editedPendingWriteArguments, policy);
        const dropped = Object.keys(editedPendingWriteArguments).filter((key) => !(key in sanitized));
        if (dropped.length > 0) {
            throw new sanitize_draft_review_patch_util_1.DraftReviewPolicyViolationError('EDITED_FIELD_NOT_ALLOWED', `arguments patch contains non-editable fields: ${dropped.join(', ')}`);
        }
        editedPendingWriteArguments = sanitized;
    }
    return Object.assign(Object.assign({}, input.decision), { editedPendingWriteArguments });
}
function decisionHasUserEdits(decision) {
    var _a;
    if ((_a = decision.editedPreviewSerialized) === null || _a === void 0 ? void 0 : _a.trim()) {
        return true;
    }
    const patch = decision.editedPendingWriteArguments;
    return patch != null && Object.keys(patch).length > 0;
}
function assertWriteToolResolvedForEdits(writeTool, toolName) {
    if (!writeTool) {
        throw new sanitize_draft_review_patch_util_1.DraftReviewPolicyViolationError('WRITE_TOOL_NOT_RESOLVED', `write tool not resolved for edit policy enforcement: ${toolName}`);
    }
}
function applyDraftReviewToPendingWrite(input) {
    if (input.decision.action !== 'confirm_with_edits') {
        return input.pending;
    }
    assertWriteToolResolvedForEdits(input.writeTool, input.pending.name);
    const decision = normalizeDecisionForPolicy(Object.assign(Object.assign({}, input), { writeTool: input.writeTool }));
    const beforeArguments = Object.assign({}, input.pending.arguments);
    let argumentsPatch = Object.assign({}, input.pending.arguments);
    if (decision.editedPendingWriteArguments && input.writeTool) {
        argumentsPatch = (0, write_tool_draft_injection_util_1.mergeWriteToolArgumentsByParamPaths)(argumentsPatch, decision.editedPendingWriteArguments, input.writeTool);
    }
    const submitText = resolveSubmitTextFromDecision(decision);
    if (submitText && input.writeTool) {
        argumentsPatch = (0, write_tool_draft_injection_util_1.injectDraftIntoWriteToolArguments)(argumentsPatch, submitText, input.writeTool);
    }
    const policy = (0, resolve_write_draft_edit_policy_util_1.resolveWriteDraftEditPolicyForToolCall)({
        writeTool: input.writeTool,
        arguments: beforeArguments,
    });
    if (policy) {
        (0, sanitize_draft_review_patch_util_1.assertNoLockedFieldChanges)({
            before: beforeArguments,
            after: argumentsPatch,
            policy,
        });
    }
    return Object.assign(Object.assign({}, input.pending), { arguments: argumentsPatch });
}
exports.applyDraftReviewToPendingWrite = applyDraftReviewToPendingWrite;
function applyDraftReviewToToolCalls(input) {
    if (input.decision.action !== 'confirm_with_edits') {
        return input.toolCalls;
    }
    if (input.toolCalls.length > 1 && decisionHasUserEdits(input.decision)) {
        throw new sanitize_draft_review_patch_util_1.DraftReviewPolicyViolationError('MULTI_WRITE_EDIT_NOT_SUPPORTED', 'confirm_with_edits is not supported when multiple write tools are pending');
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