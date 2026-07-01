"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFitReportDebugFile = exports.formatFitReportForLog = void 0;
const fs = require("node:fs");
const path = require("node:path");
const file_debug_log_util_1 = require("../../security/file-debug-log.util");
function formatFitReportForLog(report) {
    const parts = [
        `fitted=${report.fitted}`,
        `skipped=${report.skipped}`,
        `budget=${report.budget}`,
        `tokensBefore=${report.tokensBefore}`,
        `tokensAfter=${report.tokensAfter}`,
        `degradations=${report.degradations.length}`,
    ];
    if (report.callKind) {
        parts.push(`callKind=${report.callKind}`);
    }
    if (report.warnings.length > 0) {
        parts.push(`warnings=${report.warnings.join('; ')}`);
    }
    return parts.join(' ');
}
exports.formatFitReportForLog = formatFitReportForLog;
function writeFitReportDebugFile(input) {
    var _a, _b, _c;
    if (!(0, file_debug_log_util_1.isAgentEngineDebugEnabled)() || !(0, file_debug_log_util_1.isFileDebugLogEnabled)()) {
        return null;
    }
    const runId = (_a = input.hints) === null || _a === void 0 ? void 0 : _a.runId;
    const sessionId = (_b = input.hints) === null || _b === void 0 ? void 0 : _b.sessionId;
    if (runId == null || !sessionId) {
        return null;
    }
    const dir = path.join(process.cwd(), 'logs', 'agent-engine', 'prompt-budget', sessionId);
    try {
        fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, `run-${runId}-fit-report.json`);
        fs.writeFileSync(filePath, JSON.stringify({
            writtenAt: new Date().toISOString(),
            hints: (_c = input.hints) !== null && _c !== void 0 ? _c : null,
            report: input.report,
        }, null, 2), 'utf8');
        return filePath;
    }
    catch (_d) {
        return null;
    }
}
exports.writeFitReportDebugFile = writeFitReportDebugFile;
//# sourceMappingURL=fit-report.util.js.map