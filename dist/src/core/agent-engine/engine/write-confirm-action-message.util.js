"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWriteConfirmActionMessagePersistence = void 0;
const message_blocks_util_1 = require("./message/message-blocks.util");
const write_confirm_resume_blocks_util_1 = require("./write-confirm-resume-blocks.util");
function buildWriteConfirmActionMessagePersistence(input) {
    var _a, _b, _c, _d, _e, _f;
    const toolName = input.action === 'cancel_write' ? '__cancel_write__' : '__confirm_write__';
    const actionLabel = input.action === 'cancel_write' ? '取消写操作' : '确认写操作';
    const pending = input.pending;
    const toolCalls = (_a = pending === null || pending === void 0 ? void 0 : pending.toolCalls) !== null && _a !== void 0 ? _a : [];
    const toolNames = [...new Set(toolCalls.map((call) => call.name))];
    const previewBlocks = (0, write_confirm_resume_blocks_util_1.parseConfirmedPreviewBlocks)((_c = (_b = pending === null || pending === void 0 ? void 0 : pending.resumeContext) === null || _b === void 0 ? void 0 : _b.confirmedPreviewSerialized) !== null && _c !== void 0 ? _c : null);
    const previewPlain = (0, message_blocks_util_1.messageBlocksToPlainText)(previewBlocks).trim();
    const summaryLine = toolNames.length > 0
        ? `${actionLabel}：${toolNames.join('、')}`
        : actionLabel;
    const bodyParts = [summaryLine];
    if ((pending === null || pending === void 0 ? void 0 : pending.runId) != null) {
        bodyParts.push(`关联运行 #${pending.runId}`);
    }
    if (previewPlain) {
        bodyParts.push('', '待执行内容：', previewPlain);
    }
    const content = (0, message_blocks_util_1.serializeMessageBlocksForStorage)([
        (0, message_blocks_util_1.textBlock)(bodyParts.join('\n'), 'markdown'),
    ]);
    const toolInput = Object.assign({ action: input.action }, (pending
        ? {
            runId: pending.runId,
            turnId: pending.turnId,
            agentId: pending.agentId,
            toolNames,
            toolCallCount: toolCalls.length,
            latestUserMessage: pending.latestUserMessage,
            hasPreview: previewPlain.length > 0,
        }
        : { expired: true }));
    const pageContext = (_f = (_d = input.incomingPageContext) !== null && _d !== void 0 ? _d : (_e = pending === null || pending === void 0 ? void 0 : pending.resumeContext) === null || _e === void 0 ? void 0 : _e.pageContext) !== null && _f !== void 0 ? _f : null;
    return {
        content,
        toolName,
        toolInput,
        pageContext,
    };
}
exports.buildWriteConfirmActionMessagePersistence = buildWriteConfirmActionMessagePersistence;
//# sourceMappingURL=write-confirm-action-message.util.js.map