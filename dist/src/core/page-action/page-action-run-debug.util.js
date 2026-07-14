"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPageActionLlmResponse = exports.logPageActionLlmPrompt = exports.logPageActionRunDebug = void 0;
const fs = require("node:fs");
const path = require("node:path");
const common_1 = require("@nestjs/common");
const message_token_budget_util_1 = require("../llm/message-token-budget.util");
const file_debug_log_util_1 = require("../security/file-debug-log.util");
const logger = new common_1.Logger('PageActionRunDebug');
const MAX_JSON_FILE_CHARS = 2000000;
function sanitizeActionKey(actionKey) {
    return actionKey.trim().replace(/[^a-zA-Z0-9_.-]+/g, '_') || 'action';
}
function resolveRunLogFile(actionRunId, actionKey) {
    const dir = path.join(process.cwd(), 'logs', 'page-action');
    fs.mkdirSync(dir, { recursive: true });
    const key = actionKey ? `-${sanitizeActionKey(actionKey)}` : '';
    return path.join(dir, `run-${actionRunId}${key}.log`);
}
function resolvePromptJsonFile(input) {
    const dir = path.join(process.cwd(), 'logs', 'page-action', 'prompt');
    fs.mkdirSync(dir, { recursive: true });
    const key = input.actionKey ? `-${sanitizeActionKey(input.actionKey)}` : '';
    return path.join(dir, `run-${input.actionRunId}${key}-${input.stage}-${Date.now()}.json`);
}
function stringifyForLog(value, maxChars = MAX_JSON_FILE_CHARS) {
    let text;
    try {
        text = JSON.stringify(value, null, 2);
    }
    catch (_a) {
        text = String(value);
    }
    if (text.length <= maxChars) {
        return text;
    }
    return `${text.slice(0, maxChars)}\n…[truncated totalLen=${text.length}]`;
}
function normalizePromptMessages(messages) {
    return messages.map((message, index) => {
        var _a;
        const content = (_a = message.content) !== null && _a !== void 0 ? _a : '';
        const toolCallId = 'toolCallId' in message && typeof message.toolCallId === 'string'
            ? message.toolCallId
            : undefined;
        const normalized = Object.assign({ role: message.role, content }, (toolCallId ? { toolCallId } : {}));
        return Object.assign({ index, role: normalized.role, content, contentLength: content.length, estimatedTokens: (0, message_token_budget_util_1.estimateMessageTokens)(normalized) }, (toolCallId ? { toolCallId } : {}));
    });
}
function appendRunLogBlock(input) {
    var _a;
    if (!(0, file_debug_log_util_1.isPageActionRunFileDebugEnabled)()) {
        return null;
    }
    try {
        const file = resolveRunLogFile(input.actionRunId, input.actionKey);
        const header = [
            `PAGE_ACTION  stage=${input.stage}`,
            `writtenAt=${String((_a = input.record.writtenAt) !== null && _a !== void 0 ? _a : new Date().toISOString())}`,
            `actionRunId=${input.actionRunId}`,
            input.actionKey ? `actionKey=${input.actionKey}` : null,
        ]
            .filter((part) => part != null)
            .join('  ');
        const block = [
            '',
            '─'.repeat(72),
            header,
            '─'.repeat(72),
            stringifyForLog(input.record),
            '',
        ].join('\n');
        fs.appendFileSync(file, block, 'utf-8');
        return file;
    }
    catch (_b) {
        return null;
    }
}
function writePromptJsonFile(input) {
    if (!(0, file_debug_log_util_1.isPageActionRunFileDebugEnabled)()) {
        return null;
    }
    try {
        const file = resolvePromptJsonFile({
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            stage: input.stage,
        });
        fs.writeFileSync(file, `${stringifyForLog(input.record)}\n`, 'utf-8');
        return file;
    }
    catch (_a) {
        return null;
    }
}
function logPageActionRunDebug(stage, payload) {
    if (!(0, file_debug_log_util_1.isPageActionRunDebugEnabled)()) {
        return null;
    }
    const { actionRunId, actionKey } = payload, rest = __rest(payload, ["actionRunId", "actionKey"]);
    const record = Object.assign(Object.assign({ component: 'page_action', stage, writtenAt: new Date().toISOString(), actionRunId }, (actionKey ? { actionKey } : {})), rest);
    const file = appendRunLogBlock({
        actionRunId,
        actionKey,
        stage,
        record,
    });
    if ((0, file_debug_log_util_1.isPageActionRunDebugEnabled)()) {
        const rel = file ? ` → logs/${path.relative(process.cwd(), file)}` : '';
        logger.log(`page_action.${stage} actionRunId=${actionRunId}${rel}`);
    }
    return file;
}
exports.logPageActionRunDebug = logPageActionRunDebug;
function logPageActionLlmPrompt(input) {
    if (!(0, file_debug_log_util_1.isPageActionRunDebugEnabled)()) {
        return null;
    }
    const normalized = normalizePromptMessages(input.messages);
    const estimatedTokens = (0, message_token_budget_util_1.estimateMessagesTokens)(normalized.map((row) => ({
        role: row.role,
        content: row.content,
        toolCallId: row.toolCallId,
    })));
    const record = Object.assign(Object.assign(Object.assign(Object.assign({ component: 'page_action', stage: 'prompt', phase: input.phase, writtenAt: new Date().toISOString(), actionRunId: input.actionRunId }, (input.actionKey ? { actionKey: input.actionKey } : {})), { estimatedTokens, messageCount: normalized.length }), (input.meta ? { meta: input.meta } : {})), { messages: normalized });
    const jsonFile = writePromptJsonFile({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        stage: input.phase,
        record,
    });
    const promptJsonRel = jsonFile
        ? path.relative(process.cwd(), jsonFile)
        : null;
    const isPostFitPhase = /fitted|after_fit|cropped/i.test(input.phase);
    appendRunLogBlock({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        stage: 'prompt',
        record: Object.assign(Object.assign({}, record), { messages: isPostFitPhase
                ? normalized
                : normalized.map((row) => ({
                    index: row.index,
                    role: row.role,
                    contentLength: row.contentLength,
                    estimatedTokens: row.estimatedTokens,
                    contentPreview: row.content.length > 400
                        ? `${row.content.slice(0, 400)}…`
                        : row.content,
                })), promptJsonFile: promptJsonRel, messagesFullInLog: isPostFitPhase }),
    });
    if (jsonFile) {
        logger.log(`page_action.prompt phase=${input.phase} actionRunId=${input.actionRunId}` +
            ` messages=${normalized.length} tokens≈${estimatedTokens}` +
            ` → ${promptJsonRel}`);
    }
    return jsonFile;
}
exports.logPageActionLlmPrompt = logPageActionLlmPrompt;
function logPageActionLlmResponse(input) {
    var _a, _b, _c;
    return logPageActionRunDebug('llm_response', Object.assign({ actionRunId: input.actionRunId, actionKey: input.actionKey, phase: input.phase, model: (_a = input.model) !== null && _a !== void 0 ? _a : null, promptTokens: (_b = input.promptTokens) !== null && _b !== void 0 ? _b : null, completionTokens: (_c = input.completionTokens) !== null && _c !== void 0 ? _c : null }, input.detail));
}
exports.logPageActionLlmResponse = logPageActionLlmResponse;
//# sourceMappingURL=page-action-run-debug.util.js.map