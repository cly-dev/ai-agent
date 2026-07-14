"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPlanReasonHostUserLayer = exports.buildPlanReasonHostUserMarkdown = void 0;
const message_blocks_util_1 = require("../../message/message-blocks.util");
const llm_output_sanitize_util_1 = require("../../llm-output-sanitize.util");
const plan_host_fill_util_1 = require("./plan-host-fill.util");
const host_tool_string_arg_util_1 = require("../../../../host-bridge/host-tool-string-arg.util");
function readFillDisplayText(fill) {
    var _a;
    return (_a = (0, host_tool_string_arg_util_1.readHostToolStringArg)(fill.arguments)) !== null && _a !== void 0 ? _a : '';
}
function buildPlanReasonHostUserMarkdown(input) {
    var _a;
    const primary = (0, plan_host_fill_util_1.extractPrimaryFillTextFromHostFills)(input.fills);
    if (!primary) {
        return '';
    }
    const objective = (_a = input.stepObjective) === null || _a === void 0 ? void 0 : _a.trim();
    const sections = [];
    if (objective) {
        sections.push(objective);
        sections.push('');
    }
    for (const fill of input.fills) {
        const body = readFillDisplayText(fill);
        if (!body) {
            continue;
        }
        sections.push(`\`\`\`text`, body, '```');
        sections.push('');
    }
    return (0, llm_output_sanitize_util_1.sanitizeLlmFinalOutput)((0, llm_output_sanitize_util_1.sanitizeTextForStorage)(sections.join('\n').trim()));
}
exports.buildPlanReasonHostUserMarkdown = buildPlanReasonHostUserMarkdown;
function publishPlanReasonHostUserLayer(deps, input) {
    var _a, _b, _c;
    const draftReply = input.userMarkdown.trim();
    if (!draftReply) {
        const existing = (_a = deps.assistantArtifact.peekBlocks(input.sessionId, input.runId)) !== null && _a !== void 0 ? _a : [];
        return {
            draftReply: '',
            blocks: existing,
            serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(existing),
        };
    }
    const merged = (0, message_blocks_util_1.ensureAtLeastOneTextBlock)([(0, message_blocks_util_1.textBlock)(draftReply, 'markdown')], draftReply);
    const turnId = (_c = (_b = input.turnId) !== null && _b !== void 0 ? _b : deps.assistantArtifact.peekTurnId(input.sessionId, input.runId)) !== null && _c !== void 0 ? _c : undefined;
    const blocks = deps.sse.publishAssistantBlocks(input.sessionId, input.runId, merged, { turnId, phase: 'draft' });
    return {
        draftReply,
        blocks,
        serialized: (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks),
    };
}
exports.publishPlanReasonHostUserLayer = publishPlanReasonHostUserLayer;
//# sourceMappingURL=plan-reason-host-user-message.util.js.map