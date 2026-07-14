"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMutationPreviewMarkdownFromWriteCalls = exports.buildMutationPreviewUnavailableUserMessage = exports.buildMutationArgsInvalidUserMessage = exports.hasUserVisibleMutationPreview = void 0;
const message_blocks_util_1 = require("./message/message-blocks.util");
const plan_draft_reply_util_1 = require("./main/plan-present/plan-draft-reply.util");
const plan_draft_summarize_util_1 = require("./main/plan-present/plan-draft-summarize.util");
const plan_draft_summarize_util_2 = require("./main/plan-present/plan-draft-summarize.util");
const MIN_PREVIEW_SUBSTANTIVE_CHARS = 12;
function hasUserVisibleMutationPreview(input) {
    var _a, _b;
    if (((_a = input.artifact) === null || _a === void 0 ? void 0 : _a.phase) === 'draft') {
        const plain = (0, message_blocks_util_1.messageBlocksToPlainText)(input.artifact.blocks).trim();
        if (plain.replace(/\s/g, '').length >= MIN_PREVIEW_SUBSTANTIVE_CHARS) {
            return true;
        }
    }
    const draftReply = (0, plan_draft_reply_util_1.resolveLatestPlanDraftReply)(input.observations);
    if (!((_b = draftReply === null || draftReply === void 0 ? void 0 : draftReply.draftReply) === null || _b === void 0 ? void 0 : _b.trim())) {
        return false;
    }
    return (0, plan_draft_summarize_util_1.isUsablePlanMutationPreviewDraft)(draftReply.draftReply);
}
exports.hasUserVisibleMutationPreview = hasUserVisibleMutationPreview;
function buildMutationArgsInvalidUserMessage() {
    return '写操作参数未通过校验，系统正在重新整理，请稍候。';
}
exports.buildMutationArgsInvalidUserMessage = buildMutationArgsInvalidUserMessage;
function buildMutationPreviewUnavailableUserMessage() {
    return '无法生成可确认的操作预览，请补充必要信息后重试。';
}
exports.buildMutationPreviewUnavailableUserMessage = buildMutationPreviewUnavailableUserMessage;
function buildMutationPreviewMarkdownFromWriteCalls(writeCalls, scopedTools) {
    const byName = new Map(scopedTools.map((tool) => [tool.name, tool]));
    const sections = [];
    for (const call of writeCalls) {
        const def = byName.get(call.name);
        if (!def) {
            continue;
        }
        const body = (0, plan_draft_summarize_util_2.buildWriteConfirmationDetailMarkdown)({ name: call.name, arguments: call.arguments }, def);
        if (body.trim()) {
            sections.push(body.trim());
        }
    }
    return sections.join('\n\n');
}
exports.buildMutationPreviewMarkdownFromWriteCalls = buildMutationPreviewMarkdownFromWriteCalls;
//# sourceMappingURL=mutation-preview-before-gate.util.js.map