"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkflowNodeCompleteAudit = exports.buildWriteDraftStepDetail = exports.summarizeRecordForAudit = exports.buildToolCallErrorAudit = exports.buildToolCallResultAudit = exports.buildToolCallRequestAudit = exports.summarizeUnknownForAudit = exports.buildLlmOutputStepAudit = exports.buildLlmStepAudit = exports.summarizeToolCallForAudit = exports.summarizePromptMessagesForAudit = exports.summarizeTextForAudit = void 0;
const DEFAULT_STRING_PREVIEW = 240;
const DEFAULT_PROMPT_MESSAGE_MAX_CHARS = 2000;
const DEFAULT_LLM_OUTPUT_MAX_CHARS = 4000;
const DEFAULT_MAX_KEYS = 40;
function truncateText(value, maxChars) {
    if (value.length <= maxChars) {
        return value;
    }
    return `${value.slice(0, maxChars)}…`;
}
function summarizeTextForAudit(text, maxChars = DEFAULT_STRING_PREVIEW) {
    if (text == null || text.length === 0) {
        return null;
    }
    return truncateText(text, maxChars);
}
exports.summarizeTextForAudit = summarizeTextForAudit;
function summarizePromptMessagesForAudit(messages, options) {
    var _a, _b;
    const maxMessages = (_a = options === null || options === void 0 ? void 0 : options.maxMessages) !== null && _a !== void 0 ? _a : 32;
    const maxCharsPerMessage = (_b = options === null || options === void 0 ? void 0 : options.maxCharsPerMessage) !== null && _b !== void 0 ? _b : DEFAULT_PROMPT_MESSAGE_MAX_CHARS;
    return messages.slice(-maxMessages).map((msg) => {
        var _a, _b;
        return ({
            role: msg.role,
            content: truncateText((_a = msg.content) !== null && _a !== void 0 ? _a : '', maxCharsPerMessage),
            contentLength: ((_b = msg.content) !== null && _b !== void 0 ? _b : '').length,
        });
    });
}
exports.summarizePromptMessagesForAudit = summarizePromptMessagesForAudit;
function summarizeToolCallForAudit(input) {
    return {
        name: input.name,
        arguments: summarizeRecordForAudit(input.arguments),
    };
}
exports.summarizeToolCallForAudit = summarizeToolCallForAudit;
function buildLlmStepAudit(input) {
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (input.systemPrompt
        ? { systemPrompt: summarizeTextForAudit(input.systemPrompt, DEFAULT_PROMPT_MESSAGE_MAX_CHARS) }
        : {})), (input.objectivePrefix
        ? { objectivePrefix: summarizeTextForAudit(input.objectivePrefix, DEFAULT_PROMPT_MESSAGE_MAX_CHARS) }
        : {})), (input.nodeObjective
        ? { nodeObjective: summarizeTextForAudit(input.nodeObjective, DEFAULT_PROMPT_MESSAGE_MAX_CHARS) }
        : {})), { promptMessages: summarizePromptMessagesForAudit(input.promptMessages) }), (input.fittedMessageCount != null
        ? { fittedMessageCount: input.fittedMessageCount }
        : {}));
}
exports.buildLlmStepAudit = buildLlmStepAudit;
function buildLlmOutputStepAudit(input) {
    const out = {};
    if (input.assistantText) {
        out.llmRawAssistantText = summarizeTextForAudit(input.assistantText, DEFAULT_LLM_OUTPUT_MAX_CHARS);
        out.llmRawAssistantTextLength = input.assistantText.length;
    }
    if (input.userFacingText != null) {
        out.llmUserFacingText = summarizeTextForAudit(input.userFacingText, DEFAULT_LLM_OUTPUT_MAX_CHARS);
        out.llmUserFacingTextLength = input.userFacingText.length;
    }
    if (input.toolCall) {
        out.rawToolCall = summarizeToolCallForAudit(input.toolCall);
    }
    if (input.structuredOutput) {
        out.llmStructuredOutput = summarizeRecordForAudit(input.structuredOutput);
    }
    return out;
}
exports.buildLlmOutputStepAudit = buildLlmOutputStepAudit;
function summarizeUnknownForAudit(value) {
    return summarizeAuditValue(value, DEFAULT_LLM_OUTPUT_MAX_CHARS, 0);
}
exports.summarizeUnknownForAudit = summarizeUnknownForAudit;
function buildToolCallRequestAudit(input) {
    return Object.assign(Object.assign(Object.assign(Object.assign({ toolName: input.toolName }, (input.toolId != null ? { toolId: input.toolId } : {})), { argumentKeys: Object.keys(input.arguments), callArguments: summarizeRecordForAudit(input.arguments) }), (input.httpMethod ? { httpMethod: input.httpMethod } : {})), (input.httpPath ? { httpPath: input.httpPath } : {}));
}
exports.buildToolCallRequestAudit = buildToolCallRequestAudit;
function buildToolCallResultAudit(result) {
    const out = {
        toolName: result.name,
        toolId: result.toolId,
        latencyMs: result.latency,
        toolOutput: summarizeUnknownForAudit(result.output),
    };
    const http = result.httpResponse;
    if (http) {
        out.httpStatus = http.status;
        out.httpOk = http.ok;
        out.httpStatusText = http.statusText;
        out.responseBodyPreview = summarizeTextForAudit(http.bodyText, DEFAULT_LLM_OUTPUT_MAX_CHARS);
        out.responseBodyLength = http.bodyText.length;
    }
    return out;
}
exports.buildToolCallResultAudit = buildToolCallResultAudit;
function buildToolCallErrorAudit(input) {
    var _a;
    return Object.assign(Object.assign({}, buildToolCallRequestAudit({
        toolName: input.toolName,
        toolId: input.toolId,
        arguments: (_a = input.arguments) !== null && _a !== void 0 ? _a : {},
    })), { error: summarizeTextForAudit(input.error, DEFAULT_LLM_OUTPUT_MAX_CHARS) });
}
exports.buildToolCallErrorAudit = buildToolCallErrorAudit;
function summarizeAuditValue(value, stringPreviewChars, depth) {
    if (value == null || typeof value === 'number' || typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return truncateText(value, stringPreviewChars);
    }
    if (Array.isArray(value)) {
        return {
            _arrayLength: value.length,
            _preview: value
                .slice(0, 3)
                .map((row) => summarizeAuditValue(row, stringPreviewChars, depth + 1)),
        };
    }
    if (typeof value === 'object' && depth < 2) {
        return summarizeRecordForAudit(value, {
            maxKeys: 16,
            stringPreviewChars,
        });
    }
    return String(value);
}
function summarizeRecordForAudit(value, options) {
    var _a, _b;
    const maxKeys = (_a = options === null || options === void 0 ? void 0 : options.maxKeys) !== null && _a !== void 0 ? _a : DEFAULT_MAX_KEYS;
    const stringPreviewChars = (_b = options === null || options === void 0 ? void 0 : options.stringPreviewChars) !== null && _b !== void 0 ? _b : DEFAULT_STRING_PREVIEW;
    const entries = Object.entries(value);
    const out = {};
    for (const [key, raw] of entries.slice(0, maxKeys)) {
        out[key] = summarizeAuditValue(raw, stringPreviewChars, 0);
    }
    if (entries.length > maxKeys) {
        out._truncatedKeyCount = entries.length - maxKeys;
    }
    return out;
}
exports.summarizeRecordForAudit = summarizeRecordForAudit;
function buildWriteDraftStepDetail(draft) {
    var _a, _b, _c;
    const summaryText = (_a = draft.presentation.summaryText) !== null && _a !== void 0 ? _a : null;
    return {
        writeDraftVersion: draft.version,
        toolName: draft.tool.name,
        toolId: (_b = draft.tool.toolId) !== null && _b !== void 0 ? _b : null,
        riskLevel: String(draft.tool.riskLevel),
        argumentKeys: Object.keys(draft.arguments),
        writeArguments: summarizeRecordForAudit(draft.arguments),
        summaryText,
        summaryTextLength: (_c = summaryText === null || summaryText === void 0 ? void 0 : summaryText.length) !== null && _c !== void 0 ? _c : 0,
        previewBlocks: draft.presentation.previewBlocks.map((block) => summarizeRecordForAudit(block, {
            maxKeys: 12,
            stringPreviewChars: DEFAULT_STRING_PREVIEW,
        })),
        draftRetryCount: draft.provenance.draftRetryCount,
        lastEvent: draft.provenance.lastEvent,
    };
}
exports.buildWriteDraftStepDetail = buildWriteDraftStepDetail;
function buildWorkflowNodeCompleteAudit(action, nodeOutput) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!nodeOutput || typeof nodeOutput !== 'object' || Array.isArray(nodeOutput)) {
        return {};
    }
    const row = nodeOutput;
    switch (action) {
        case 'present_mutation':
        case 'summarize': {
            const summaryText = typeof row.summaryText === 'string' ? row.summaryText : null;
            return {
                mode: (_a = row.mode) !== null && _a !== void 0 ? _a : null,
                summaryTextLength: (_b = summaryText === null || summaryText === void 0 ? void 0 : summaryText.length) !== null && _b !== void 0 ? _b : 0,
                summaryPreview: summaryText
                    ? truncateText(summaryText, DEFAULT_STRING_PREVIEW)
                    : null,
            };
        }
        case 'fetch_data':
            return {
                toolName: (_c = row.toolName) !== null && _c !== void 0 ? _c : null,
                toolId: (_d = row.toolId) !== null && _d !== void 0 ? _d : null,
                toolOutput: 'output' in row ? summarizeUnknownForAudit(row.output) : null,
            };
        case 'write_data':
            return {
                toolName: (_e = row.tool) !== null && _e !== void 0 ? _e : null,
                toolOutput: 'output' in row ? summarizeUnknownForAudit(row.output) : null,
            };
        case 'compose_mutation':
            return {
                toolName: (_f = row.tool) !== null && _f !== void 0 ? _f : null,
                toolId: (_g = row.toolId) !== null && _g !== void 0 ? _g : null,
                argumentKeys: row.arguments && typeof row.arguments === 'object' && !Array.isArray(row.arguments)
                    ? Object.keys(row.arguments)
                    : [],
                writeArguments: row.arguments && typeof row.arguments === 'object' && !Array.isArray(row.arguments)
                    ? summarizeRecordForAudit(row.arguments)
                    : null,
            };
        case 'summarize_images':
            return {
                groupCount: (_h = row.groupCount) !== null && _h !== void 0 ? _h : null,
                cellCount: (_j = row.cellCount) !== null && _j !== void 0 ? _j : null,
            };
        default:
            return {};
    }
}
exports.buildWorkflowNodeCompleteAudit = buildWorkflowNodeCompleteAudit;
//# sourceMappingURL=page-action-run-audit.util.js.map