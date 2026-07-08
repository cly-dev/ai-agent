"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHostToolResolve = exports.isHostToolResolveDebugEnabled = void 0;
const fs = require("node:fs");
const path = require("node:path");
const file_debug_log_util_1 = require("../security/file-debug-log.util");
function isHostToolResolveDebugEnabled() {
    return (0, file_debug_log_util_1.isAgentEngineDebugEnabled)();
}
exports.isHostToolResolveDebugEnabled = isHostToolResolveDebugEnabled;
function resolveHostToolResolveLogFile(payload) {
    const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'host-tool-resolve');
    const runId = payload.runId;
    if (typeof runId === 'number') {
        return path.join(dir, `run-${runId}.log`);
    }
    const sessionId = payload.sessionId;
    if (typeof sessionId === 'string' && sessionId.trim()) {
        return path.join(dir, `session-${sessionId.trim()}.log`);
    }
    return path.join(dir, 'misc.log');
}
function truncateJson(value, maxLen = 48000) {
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
function appendHostToolResolveBlock(file, stage, record) {
    const header = [
        `HOST TOOL RESOLVE  stage=${stage}`,
        `writtenAt=${record.writtenAt}`,
        record.runId != null ? `runId=${record.runId}` : null,
        record.sessionId != null ? `sessionId=${record.sessionId}` : null,
        record.agentId != null ? `agentId=${record.agentId}` : null,
        record.skillId != null ? `skillId=${record.skillId}` : null,
        record.pageScope != null ? `pageScope=${record.pageScope}` : null,
        record.selectionBranch != null
            ? `selectionBranch=${record.selectionBranch}`
            : null,
        record.toolCount != null ? `toolCount=${record.toolCount}` : null,
    ]
        .filter((part) => part != null)
        .join('  ');
    const block = [
        '',
        '─'.repeat(72),
        header,
        '─'.repeat(72),
        truncateJson(record),
        '',
    ].join('\n');
    fs.appendFileSync(file, block, 'utf-8');
}
function logHostToolResolve(stage, payload) {
    if (!isHostToolResolveDebugEnabled()) {
        return null;
    }
    if (!(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    const record = Object.assign({ component: 'host_tool_resolve', stage, writtenAt: new Date().toISOString() }, payload);
    try {
        const file = resolveHostToolResolveLogFile(payload);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        appendHostToolResolveBlock(file, stage, record);
        return file;
    }
    catch (_a) {
        return null;
    }
}
exports.logHostToolResolve = logHostToolResolve;
//# sourceMappingURL=host-tool-resolve-debug.util.js.map