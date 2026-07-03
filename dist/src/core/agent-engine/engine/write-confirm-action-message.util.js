"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWriteConfirmActionMessagePersistence = void 0;
const message_blocks_util_1 = require("./message/message-blocks.util");
const write_confirm_resume_blocks_util_1 = require("./write-confirm-resume-blocks.util");
function resolveActionKind(decision) {
    switch (decision.action) {
        case 'cancel':
            return 'cancel_write';
        case 'retry':
            return 'retry_write';
        case 'confirm_with_edits':
            return 'confirm_write_with_edits';
        default:
            return 'confirm_write';
    }
}
function resolveActionLabel(kind) {
    switch (kind) {
        case 'cancel_write':
            return '取消写操作';
        case 'retry_write':
            return '重试生成';
        case 'confirm_write_with_edits':
            return '确认写操作（已编辑）';
        default:
            return '确认写操作';
    }
}
function resolveToolName(kind) {
    switch (kind) {
        case 'cancel_write':
            return '__cancel_write__';
        case 'retry_write':
            return '__retry_write__';
        case 'confirm_write_with_edits':
            return '__confirm_write_edited__';
        default:
            return '__confirm_write__';
    }
}
function buildWriteConfirmActionMessagePersistence(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const actionKind = resolveActionKind(input.decision);
    const toolName = resolveToolName(actionKind);
    const actionLabel = resolveActionLabel(actionKind);
    const pending = input.pending;
    const toolCalls = (_a = pending === null || pending === void 0 ? void 0 : pending.toolCalls) !== null && _a !== void 0 ? _a : [];
    const toolNames = [...new Set(toolCalls.map((call) => call.name))];
    const previewBlocks = (0, write_confirm_resume_blocks_util_1.parseConfirmedPreviewBlocks)((_d = (_b = input.decision.editedPreviewSerialized) !== null && _b !== void 0 ? _b : (_c = pending === null || pending === void 0 ? void 0 : pending.resumeContext) === null || _c === void 0 ? void 0 : _c.confirmedPreviewSerialized) !== null && _d !== void 0 ? _d : null);
    const previewPlain = (0, message_blocks_util_1.messageBlocksToPlainText)(previewBlocks).trim();
    const summaryLine = toolNames.length > 0
        ? `${actionLabel}：${toolNames.join('、')}`
        : actionLabel;
    const bodyParts = [summaryLine];
    if ((pending === null || pending === void 0 ? void 0 : pending.runId) != null) {
        bodyParts.push(`关联运行 #${pending.runId}`);
    }
    if ((_e = input.decision.retryInstruction) === null || _e === void 0 ? void 0 : _e.trim()) {
        bodyParts.push('', '重试说明：', input.decision.retryInstruction.trim());
    }
    if (previewPlain) {
        bodyParts.push('', '待执行内容：', previewPlain);
    }
    const content = (0, message_blocks_util_1.serializeMessageBlocksForStorage)([
        (0, message_blocks_util_1.textBlock)(bodyParts.join('\n'), 'markdown'),
    ]);
    const toolInput = Object.assign({ action: actionKind, writeGate: input.decision }, (pending
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
    const pageContext = (_h = (_f = input.incomingPageContext) !== null && _f !== void 0 ? _f : (_g = pending === null || pending === void 0 ? void 0 : pending.resumeContext) === null || _g === void 0 ? void 0 : _g.pageContext) !== null && _h !== void 0 ? _h : null;
    return {
        content,
        toolName,
        toolInput,
        pageContext,
    };
}
exports.buildWriteConfirmActionMessagePersistence = buildWriteConfirmActionMessagePersistence;
//# sourceMappingURL=write-confirm-action-message.util.js.map