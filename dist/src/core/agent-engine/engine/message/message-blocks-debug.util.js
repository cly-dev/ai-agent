"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPersistContentMismatch = exports.serializedSourceSnapshot = exports.blocksSourceSnapshot = exports.emitAgentMessagePersistDebug = exports.emitAgentMessageSseDebug = exports.isMessageBlocksDebugEnabled = void 0;
const fs = require("node:fs");
const path = require("node:path");
const file_debug_log_util_1 = require("../../../security/file-debug-log.util");
const llm_prompt_debug_util_1 = require("../llm-prompt-debug.util");
const message_blocks_util_1 = require("./message-blocks.util");
function isMessageBlocksDebugEnabled() {
    return (0, llm_prompt_debug_util_1.isLlmPromptDebugEnabled)();
}
exports.isMessageBlocksDebugEnabled = isMessageBlocksDebugEnabled;
function resolveMessageBlocksDebugLogFile(input) {
    const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'message-blocks');
    if (input.runId != null) {
        return path.join(dir, `run-${input.runId}.log`);
    }
    if (input.sessionId) {
        return path.join(dir, `session-${input.sessionId}.log`);
    }
    return path.join(dir, 'misc.log');
}
function truncateJson(value, maxLen = 24000) {
    let text;
    try {
        text = JSON.stringify(value, null, 2);
    }
    catch (_a) {
        text = String(value);
    }
    if (text.length <= maxLen) {
        return text;
    }
    return `${text.slice(0, maxLen)}\n…[truncated totalLen=${text.length}]`;
}
function appendDebugBlock(file, header, body) {
    const block = [
        '',
        '─'.repeat(72),
        header,
        '─'.repeat(72),
        body,
        '',
    ].join('\n');
    fs.appendFileSync(file, block, 'utf-8');
}
function emitAgentMessageSseDebug(input) {
    var _a;
    if (!isMessageBlocksDebugEnabled()) {
        return null;
    }
    if (!(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    const record = {
        writtenAt: new Date().toISOString(),
        tag: input.tag,
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        sseEvent: { event: 'message', payload: input.ssePayload },
        source: input.source,
    };
    try {
        const file = resolveMessageBlocksDebugLogFile(input);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const header = [
            `SSE message  tag=${input.tag}`,
            `sessionId=${input.sessionId}`,
            input.runId != null ? `runId=${input.runId}` : null,
            input.turnId != null ? `turnId=${input.turnId}` : null,
            `action=${String((_a = input.ssePayload.action) !== null && _a !== void 0 ? _a : '-')}`,
            input.ssePayload.seq != null ? `seq=${input.ssePayload.seq}` : null,
            input.ssePayload.mode != null ? `mode=${input.ssePayload.mode}` : null,
        ]
            .filter((part) => part != null)
            .join('  ');
        appendDebugBlock(file, header, `sseEvent:\n${truncateJson(record.sseEvent)}\n\nsource:\n${truncateJson(record.source)}`);
        return file;
    }
    catch (_b) {
        return null;
    }
}
exports.emitAgentMessageSseDebug = emitAgentMessageSseDebug;
function emitAgentMessagePersistDebug(input) {
    if (!isMessageBlocksDebugEnabled()) {
        return null;
    }
    if (!(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    try {
        const file = resolveMessageBlocksDebugLogFile(input);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const header = [
            `DB persist  tag=${input.tag}`,
            `sessionId=${input.sessionId}`,
            `runId=${input.runId}`,
            `turnId=${input.turnId}`,
            input.messageId != null ? `messageId=${input.messageId}` : null,
        ]
            .filter((part) => part != null)
            .join('  ');
        appendDebugBlock(file, header, `dbContent:\n${truncateJson(input.dbContent)}\n\nsource:\n${truncateJson(input.source)}`);
        return file;
    }
    catch (_a) {
        return null;
    }
}
exports.emitAgentMessagePersistDebug = emitAgentMessagePersistDebug;
function blocksSourceSnapshot(blocks, options) {
    const serialized = (0, message_blocks_util_1.serializeMessageBlocksForStorage)(blocks);
    return Object.assign(Object.assign({}, ((options === null || options === void 0 ? void 0 : options.label) ? { label: options.label } : {})), { blocks, storageSerialized: serialized });
}
exports.blocksSourceSnapshot = blocksSourceSnapshot;
function serializedSourceSnapshot(serialized, options) {
    return Object.assign(Object.assign(Object.assign({}, ((options === null || options === void 0 ? void 0 : options.label) ? { label: options.label } : {})), { storageSerialized: serialized }), ((options === null || options === void 0 ? void 0 : options.blocks) ? { blocks: options.blocks } : {}));
}
exports.serializedSourceSnapshot = serializedSourceSnapshot;
function logPersistContentMismatch(input) {
    if (!isMessageBlocksDebugEnabled() ||
        input.artifactSerialized === input.priorDbContent) {
        return;
    }
    emitAgentMessagePersistDebug({
        tag: `${input.tag}_MISMATCH`,
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
        dbContent: input.artifactSerialized,
        source: {
            artifactSerialized: input.artifactSerialized,
            priorDbContent: input.priorDbContent,
        },
    });
}
exports.logPersistContentMismatch = logPersistContentMismatch;
//# sourceMappingURL=message-blocks-debug.util.js.map