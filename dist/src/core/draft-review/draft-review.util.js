"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRetryUserMessage = exports.draftReviewDecisionFromLegacyFlags = exports.normalizeDraftReviewDecision = exports.isDraftReviewAction = void 0;
const draft_review_types_1 = require("./draft-review.types");
function isDraftReviewAction(value) {
    return (typeof value === 'string' &&
        draft_review_types_1.DRAFT_REVIEW_ACTIONS.includes(value));
}
exports.isDraftReviewAction = isDraftReviewAction;
function normalizeDraftReviewDecision(input) {
    if (!input || !isDraftReviewAction(input.action)) {
        return null;
    }
    const editedPreviewSerialized = typeof input.editedPreviewSerialized === 'string'
        ? input.editedPreviewSerialized.trim() || null
        : null;
    const editedPendingWriteArguments = input.editedPendingWriteArguments &&
        typeof input.editedPendingWriteArguments === 'object' &&
        !Array.isArray(input.editedPendingWriteArguments)
        ? input.editedPendingWriteArguments
        : null;
    const retryInstruction = typeof input.retryInstruction === 'string'
        ? input.retryInstruction.trim() || null
        : null;
    if (input.action === 'confirm_with_edits') {
        if (!editedPreviewSerialized && !editedPendingWriteArguments) {
            return null;
        }
    }
    if (input.action === 'retry' && !retryInstruction) {
        return null;
    }
    return {
        action: input.action,
        editedPreviewSerialized,
        editedPendingWriteArguments,
        retryInstruction,
    };
}
exports.normalizeDraftReviewDecision = normalizeDraftReviewDecision;
function draftReviewDecisionFromLegacyFlags(input) {
    if (input.cancelWrite) {
        return { action: 'cancel' };
    }
    if (input.confirmWrite) {
        return { action: 'confirm' };
    }
    return null;
}
exports.draftReviewDecisionFromLegacyFlags = draftReviewDecisionFromLegacyFlags;
function buildRetryUserMessage(input) {
    const base = input.baseUserMessage.trim();
    const instruction = input.retryInstruction.trim();
    if (!instruction) {
        return base;
    }
    if (!base) {
        return instruction;
    }
    return `${base}\n\n[Regenerate request]: ${instruction}`;
}
exports.buildRetryUserMessage = buildRetryUserMessage;
//# sourceMappingURL=draft-review.util.js.map