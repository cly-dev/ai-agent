"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToolExecutionDebug = exports.formatToolExecutionDebugForConsole = exports.serializeAgentRunStepPayload = exports.isToolExecutionDebugEnabled = void 0;
const fs = require("node:fs");
const path = require("node:path");
const file_debug_log_util_1 = require("../../../security/file-debug-log.util");
const llm_prompt_debug_util_1 = require("../llm-prompt-debug.util");
function isToolExecutionDebugEnabled() {
    return (0, llm_prompt_debug_util_1.isLlmPromptDebugEnabled)();
}
exports.isToolExecutionDebugEnabled = isToolExecutionDebugEnabled;
function serializeAgentRunStepPayload(value) {
    if (value === null || value === undefined) {
        return {};
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    return { value };
}
exports.serializeAgentRunStepPayload = serializeAgentRunStepPayload;
function truncateJson(value, maxLen = 4000) {
    let text;
    try {
        text = JSON.stringify(value);
    }
    catch (_a) {
        text = String(value);
    }
    if (text.length <= maxLen) {
        return text;
    }
    return `${text.slice(0, maxLen)}…[truncated len=${text.length}]`;
}
function formatToolExecutionDebugForConsole(record) {
    var _a, _b;
    const header = [
        '',
        '─'.repeat(72),
        `TOOL EXEC  tool=${record.toolName}  runId=${(_a = record.runId) !== null && _a !== void 0 ? _a : '-'}  step=${record.step}  iteration=${record.iteration}`,
        `sessionId=${(_b = record.sessionId) !== null && _b !== void 0 ? _b : '-'}  status=${record.executionStatus}  latencyMs=${record.latencyMs}`,
        '─'.repeat(72),
    ].join('\n');
    const httpSection = record.httpRequest
        ? [
            `HTTP ${record.httpRequest.method} ${record.httpRequest.resolvedPath}`,
            `pathTemplate: ${record.httpRequest.pathTemplate}`,
            `url: ${record.httpRequest.url}`,
            `parameters.header:\n${truncateJson(record.httpRequest.parameters.header)}`,
            `parameters.path:\n${truncateJson(record.httpRequest.parameters.path)}`,
            `parameters.query:\n${truncateJson(record.httpRequest.parameters.query)}`,
            `parameters.body:\n${truncateJson(record.httpRequest.parameters.body)}`,
            record.httpRequest.bodyJson
                ? `bodyJson:\n${truncateJson(record.httpRequest.bodyJson)}`
                : null,
        ]
            .filter((line) => line != null)
            .join('\n')
        : null;
    const responseSection = record.responseSource !== undefined
        ? `Response source:\n${truncateJson(record.responseSource)}`
        : null;
    const body = [
        httpSection ? `HTTP request:\n${httpSection}` : null,
        responseSection,
        `LLM arguments:\n${truncateJson(record.llmArguments)}`,
        `Executed input:\n${truncateJson(record.executedInput)}`,
        `Raw output:\n${truncateJson(record.rawOutput)}`,
        record.observationOutput !== undefined
            ? `Observation output:\n${truncateJson(record.observationOutput)}`
            : null,
    ]
        .filter((line) => line != null)
        .join('\n\n');
    return `${header}\n${body}\n${'─'.repeat(72)}\n`;
}
exports.formatToolExecutionDebugForConsole = formatToolExecutionDebugForConsole;
function emitToolExecutionDebug(log, input) {
    var _a;
    if (!isToolExecutionDebugEnabled()) {
        return null;
    }
    const record = Object.assign(Object.assign({}, input), { writtenAt: new Date().toISOString() });
    log(formatToolExecutionDebugForConsole(record));
    if (!(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    try {
        const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'tool');
        fs.mkdirSync(dir, { recursive: true });
        const file = path.join(dir, `run-${(_a = input.runId) !== null && _a !== void 0 ? _a : 0}-step-${input.step}-${input.toolName}-${Date.now()}.json`);
        fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf-8');
        return file;
    }
    catch (_b) {
        return null;
    }
}
exports.emitToolExecutionDebug = emitToolExecutionDebug;
//# sourceMappingURL=tool-execution-debug.util.js.map