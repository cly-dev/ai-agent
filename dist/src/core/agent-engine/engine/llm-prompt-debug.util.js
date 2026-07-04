"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeLlmPromptDebugFile = exports.isLlmPromptDebugFileEnabled = exports.emitLlmPromptDebug = exports.formatLlmPromptDebugForConsole = exports.isLlmPromptDebugEnabled = void 0;
const fs = require("node:fs");
const path = require("node:path");
const file_debug_log_util_1 = require("../../security/file-debug-log.util");
const message_token_budget_util_1 = require("../../llm/message-token-budget.util");
function isLlmPromptDebugEnabled() {
    return (0, file_debug_log_util_1.isAgentEngineDebugEnabled)();
}
exports.isLlmPromptDebugEnabled = isLlmPromptDebugEnabled;
function buildLlmPromptDebugRecord(input) {
    const normalized = input.messages.map((message) => ({
        role: message.role,
        content: message.content,
        toolCallId: 'toolCallId' in message && typeof message.toolCallId === 'string'
            ? message.toolCallId
            : undefined,
    }));
    return {
        runId: input.runId,
        sessionId: input.sessionId,
        phase: input.phase,
        step: input.step,
        iteration: input.iteration,
        messageTokenBudget: input.messageTokenBudget,
        estimatedTokens: (0, message_token_budget_util_1.estimateMessagesTokens)(normalized),
        writtenAt: new Date().toISOString(),
        meta: input.meta,
        messages: normalized.map((message, index) => (Object.assign({ index, role: message.role, estimatedTokens: (0, message_token_budget_util_1.estimateMessageTokens)(message), content: message.content }, (message.toolCallId ? { toolCallId: message.toolCallId } : {})))),
    };
}
function formatLlmPromptDebugForConsole(record) {
    var _a, _b, _c;
    const header = [
        '',
        '═'.repeat(72),
        `LLM PROMPT  phase=${record.phase}  runId=${record.runId}  step=${(_a = record.step) !== null && _a !== void 0 ? _a : '-'}  iteration=${(_b = record.iteration) !== null && _b !== void 0 ? _b : '-'}`,
        `sessionId=${record.sessionId}  estimatedTokens≈${record.estimatedTokens}  budget=${(_c = record.messageTokenBudget) !== null && _c !== void 0 ? _c : '-'}`,
        '═'.repeat(72),
    ].join('\n');
    const body = record.messages
        .map((message) => `\n── message[${message.index}] role=${message.role} tokens≈${message.estimatedTokens} ──\n${message.content}`)
        .join('\n');
    return `${header}${body}\n${'═'.repeat(72)}\n`;
}
exports.formatLlmPromptDebugForConsole = formatLlmPromptDebugForConsole;
function emitLlmPromptDebug(log, input) {
    var _a;
    if (!isLlmPromptDebugEnabled()) {
        return null;
    }
    const record = buildLlmPromptDebugRecord(input);
    log(formatLlmPromptDebugForConsole(record));
    if (!(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    try {
        const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'prompt');
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `run-${input.runId}-step-${(_a = input.step) !== null && _a !== void 0 ? _a : 0}-${input.phase}-${Date.now()}.json`);
        fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
        return file;
    }
    catch (_b) {
        return null;
    }
}
exports.emitLlmPromptDebug = emitLlmPromptDebug;
function isLlmPromptDebugFileEnabled() {
    return isLlmPromptDebugEnabled();
}
exports.isLlmPromptDebugFileEnabled = isLlmPromptDebugFileEnabled;
function writeLlmPromptDebugFile(input) {
    return emitLlmPromptDebug(() => { }, input);
}
exports.writeLlmPromptDebugFile = writeLlmPromptDebugFile;
//# sourceMappingURL=llm-prompt-debug.util.js.map