"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeConfirmedPreviewWithExecutionStatus = exports.extractWriteConfirmExecutionStatusBlocks = exports.stripWriteConfirmationPromptBlocks = exports.parseConfirmedPreviewBlocks = void 0;
const write_confirmation_gate_util_1 = require("./write-confirmation-gate.util");
const message_blocks_util_1 = require("./message/message-blocks.util");
function parseConfirmedPreviewBlocks(serialized) {
    var _a, _b;
    const trimmed = (_a = serialized === null || serialized === void 0 ? void 0 : serialized.trim()) !== null && _a !== void 0 ? _a : '';
    if (!trimmed) {
        return [];
    }
    const blocks = (_b = (0, message_blocks_util_1.tryParseStoredMessageBlocks)(trimmed)) !== null && _b !== void 0 ? _b : (trimmed
        ? [{ type: 'text', content: trimmed, format: 'markdown' }]
        : []);
    return stripWriteConfirmationPromptBlocks(blocks, (0, write_confirmation_gate_util_1.buildWriteConfirmationUserMessage)()).filter((block) => !(block.type === 'text' && block.content.trim().length === 0));
}
exports.parseConfirmedPreviewBlocks = parseConfirmedPreviewBlocks;
function stripWriteConfirmationPromptBlocks(blocks, gateMessage) {
    const gate = gateMessage.trim();
    if (!gate) {
        return (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks);
    }
    return (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks.filter((block) => !(block.type === 'text' && block.content.trim() === gate)));
}
exports.stripWriteConfirmationPromptBlocks = stripWriteConfirmationPromptBlocks;
function extractWriteConfirmExecutionStatusBlocks(blocks) {
    return (0, message_blocks_util_1.sanitizeMessageBlocks)(blocks.filter(message_blocks_util_1.isStructuredMessageBlock));
}
exports.extractWriteConfirmExecutionStatusBlocks = extractWriteConfirmExecutionStatusBlocks;
function mergeConfirmedPreviewWithExecutionStatus(input) {
    var _a;
    const preview = (0, message_blocks_util_1.sanitizeMessageBlocks)(input.confirmedPreview);
    if (preview.length === 0) {
        return [];
    }
    const statusBlocks = extractWriteConfirmExecutionStatusBlocks(input.executionStatusBlocks);
    const fromObservation = (0, message_blocks_util_1.sanitizeMessageBlocks)(((_a = input.observationStructuredBlocks) !== null && _a !== void 0 ? _a : []).filter(message_blocks_util_1.isStructuredMessageBlock));
    const extras = (0, message_blocks_util_1.filterLlmBlocksAvoidDuplicatingRule)(preview, (0, message_blocks_util_1.mergeMessageBlocks)(statusBlocks, fromObservation));
    return (0, message_blocks_util_1.sanitizeMessageBlocks)((0, message_blocks_util_1.mergeMessageBlocks)(preview, extras));
}
exports.mergeConfirmedPreviewWithExecutionStatus = mergeConfirmedPreviewWithExecutionStatus;
//# sourceMappingURL=write-confirm-resume-blocks.util.js.map