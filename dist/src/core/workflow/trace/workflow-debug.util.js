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
exports.isWorkflowFileDebugEnabled = exports.isWorkflowDebugEnabled = exports.logWorkflowGraphBoot = exports.logWorkflowDebug = void 0;
const fs = require("node:fs");
const path = require("node:path");
const file_debug_log_util_1 = require("../../security/file-debug-log.util");
Object.defineProperty(exports, "isWorkflowDebugEnabled", { enumerable: true, get: function () { return file_debug_log_util_1.isWorkflowDebugEnabled; } });
Object.defineProperty(exports, "isWorkflowFileDebugEnabled", { enumerable: true, get: function () { return file_debug_log_util_1.isWorkflowFileDebugEnabled; } });
function resolveWorkflowLogFile(payload) {
    const dir = path.join(process.cwd(), 'logs', 'workflow');
    const runId = payload.runId;
    if (typeof runId === 'number' && Number.isFinite(runId)) {
        return path.join(dir, `run-${runId}.log`);
    }
    const actionRunId = payload.actionRunId;
    if (typeof actionRunId === 'number' && Number.isFinite(actionRunId)) {
        const actionKey = typeof payload.actionKey === 'string' && payload.actionKey.trim()
            ? `-${payload.actionKey.trim().replace(/[^a-zA-Z0-9_-]+/g, '_')}`
            : '';
        return path.join(dir, `page-action-${actionRunId}${actionKey}.log`);
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
function summarizeWorkflowRun(run) {
    var _a;
    if (!run) {
        return null;
    }
    return {
        workflowId: run.workflowId,
        version: run.version,
        status: run.status,
        compiledFrom: (_a = run.compiledFrom) !== null && _a !== void 0 ? _a : null,
        currentNodeId: run.currentNodeId,
        nodes: run.nodes.map((row) => {
            var _a, _b;
            return ({
                nodeId: row.nodeId,
                action: row.action,
                status: row.status,
                outputRef: (_a = row.outputRef) !== null && _a !== void 0 ? _a : null,
                error: (_b = row.error) !== null && _b !== void 0 ? _b : null,
            });
        }),
    };
}
function appendWorkflowBlock(file, stage, record) {
    const header = [
        `WORKFLOW  stage=${stage}`,
        `writtenAt=${record.writtenAt}`,
        record.runId != null ? `runId=${record.runId}` : null,
        record.sessionId != null ? `sessionId=${record.sessionId}` : null,
        record.turnId != null ? `turnId=${record.turnId}` : null,
        record.actionRunId != null ? `actionRunId=${record.actionRunId}` : null,
        record.nodeId != null ? `nodeId=${record.nodeId}` : null,
        record.action != null ? `action=${record.action}` : null,
        record.outcome != null ? `outcome=${record.outcome}` : null,
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
function logWorkflowDebug(stage, payload) {
    if (!(0, file_debug_log_util_1.isWorkflowDebugEnabled)() || !(0, file_debug_log_util_1.isWorkflowFileDebugEnabled)()) {
        return null;
    }
    const { workflowRun } = payload, rest = __rest(payload, ["workflowRun"]);
    const record = Object.assign(Object.assign({ component: 'workflow', stage, writtenAt: new Date().toISOString() }, rest), (workflowRun != null
        ? { workflowRunSummary: summarizeWorkflowRun(workflowRun) }
        : {}));
    try {
        const file = resolveWorkflowLogFile(payload);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        appendWorkflowBlock(file, stage, record);
        return file;
    }
    catch (_a) {
        return null;
    }
}
exports.logWorkflowDebug = logWorkflowDebug;
function logWorkflowGraphBoot(input) {
    return logWorkflowDebug('graph_boot', {
        runId: input.runId,
        sessionId: input.sessionId,
        workflowGraphVersion: 'v2',
    });
}
exports.logWorkflowGraphBoot = logWorkflowGraphBoot;
//# sourceMappingURL=workflow-debug.util.js.map