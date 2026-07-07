"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAgentRunResponseList = exports.toAgentRunResponse = void 0;
function normalizeToolsUsed(value) {
    if (value == null) {
        return null;
    }
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === 'string');
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        const names = value.names;
        if (Array.isArray(names)) {
            return names.filter((item) => typeof item === 'string');
        }
    }
    return null;
}
function normalizeToolQualityCounts(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const row = value;
    const quality = row.qualityCounts;
    if (!quality || typeof quality !== 'object' || Array.isArray(quality)) {
        return null;
    }
    const high = typeof quality.high === 'number' && Number.isFinite(quality.high)
        ? Math.max(0, Math.floor(quality.high))
        : 0;
    const medium = typeof quality.medium === 'number' && Number.isFinite(quality.medium)
        ? Math.max(0, Math.floor(quality.medium))
        : 0;
    const low = typeof quality.low === 'number' && Number.isFinite(quality.low)
        ? Math.max(0, Math.floor(quality.low))
        : 0;
    return { high, medium, low };
}
function normalizeToolMachineCodeCounts(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const row = value;
    const counts = row.codeCounts;
    if (!counts || typeof counts !== 'object' || Array.isArray(counts)) {
        return null;
    }
    const asInt = (num) => typeof num === 'number' && Number.isFinite(num)
        ? Math.max(0, Math.floor(num))
        : 0;
    return {
        INTENT_RECALL_FAILED: asInt(counts.INTENT_RECALL_FAILED),
        TOOL_AUTH_FAILED: asInt(counts.TOOL_AUTH_FAILED),
        TOOL_TIMEOUT: asInt(counts.TOOL_TIMEOUT),
        TOOL_EMPTY_RESULT: asInt(counts.TOOL_EMPTY_RESULT),
        TOOL_DOWNSTREAM_ERROR: asInt(counts.TOOL_DOWNSTREAM_ERROR),
        LLM_TIMEOUT: asInt(counts.LLM_TIMEOUT),
        LLM_RATE_LIMIT: asInt(counts.LLM_RATE_LIMIT),
    };
}
function toAgentRunResponse(row) {
    return Object.assign(Object.assign({}, row), { toolsUsed: normalizeToolsUsed(row.toolsUsed), toolQualityCounts: normalizeToolQualityCounts(row.toolsUsed), toolMachineCodeCounts: normalizeToolMachineCodeCounts(row.toolsUsed) });
}
exports.toAgentRunResponse = toAgentRunResponse;
function toAgentRunResponseList(rows) {
    return rows.map(toAgentRunResponse);
}
exports.toAgentRunResponseList = toAgentRunResponseList;
//# sourceMappingURL=agent-run.mapper.js.map