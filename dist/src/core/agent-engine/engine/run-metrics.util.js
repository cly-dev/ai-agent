"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveFinishReason = exports.aggregateRunMetrics = exports.snapshotRunMetrics = exports.recordMachineCodeUsage = exports.recordToolUsage = exports.recordLlmUsage = exports.recordGatherPageSummaryLlmUsage = exports.createRunMetricsAccumulator = void 0;
const message_token_budget_util_1 = require("../../llm/message-token-budget.util");
const llm_response_meta_util_1 = require("../../llm/llm-response-meta.util");
function createRunMetricsAccumulator() {
    return {
        llmCallCount: 0,
        gatherPageSummaryCallCount: 0,
        toolCallCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        llmDurationMs: 0,
        toolDurationMs: 0,
        toolsUsed: new Set(),
        toolQualityCounts: {
            high: 0,
            medium: 0,
            low: 0,
        },
        machineCodeCounts: {
            INTENT_RECALL_FAILED: 0,
            SKILL_NOT_VISIBLE: 0,
            SKILL_TOOLS_EMPTY: 0,
            SKILL_NOT_IN_SCOPE: 0,
            SKILL_EXPAND_FAILED: 0,
            TOOL_AUTH_FAILED: 0,
            TOOL_TIMEOUT: 0,
            TOOL_EMPTY_RESULT: 0,
            TOOL_DOWNSTREAM_ERROR: 0,
            LLM_TIMEOUT: 0,
            LLM_RATE_LIMIT: 0,
            WRITE_CONFIRMATION_REQUIRED: 0,
        },
        startedAtMs: Date.now(),
    };
}
exports.createRunMetricsAccumulator = createRunMetricsAccumulator;
function recordGatherPageSummaryLlmUsage(acc, input) {
    acc.gatherPageSummaryCallCount += 1;
    recordLlmUsage(acc, input);
}
exports.recordGatherPageSummaryLlmUsage = recordGatherPageSummaryLlmUsage;
function recordLlmUsage(acc, input) {
    var _a;
    acc.llmCallCount += 1;
    acc.llmDurationMs += Math.max(0, input.durationMs);
    if ((_a = input.model) === null || _a === void 0 ? void 0 : _a.trim()) {
        acc.model = input.model.trim();
    }
    const usage = (0, llm_response_meta_util_1.extractLlmTokenUsageFromResponseMeta)(input.responseMeta);
    if (usage) {
        acc.promptTokens += usage.promptTokens;
        acc.completionTokens += usage.completionTokens;
        return;
    }
    acc.promptTokens += (0, message_token_budget_util_1.estimateMessagesTokens)(input.messages);
    acc.completionTokens += (0, message_token_budget_util_1.estimateTextTokens)(input.outputText);
}
exports.recordLlmUsage = recordLlmUsage;
function recordToolUsage(acc, input) {
    acc.toolCallCount += 1;
    acc.toolDurationMs += Math.max(0, input.latencyMs);
    const name = input.name.trim();
    if (name) {
        acc.toolsUsed.add(name);
    }
    if (input.quality) {
        acc.toolQualityCounts[input.quality] += 1;
    }
}
exports.recordToolUsage = recordToolUsage;
function recordMachineCodeUsage(acc, code) {
    if (!code) {
        return;
    }
    acc.machineCodeCounts[code] += 1;
}
exports.recordMachineCodeUsage = recordMachineCodeUsage;
function snapshotRunMetrics(acc, finishedAtMs = Date.now()) {
    const promptTokens = acc.promptTokens;
    const completionTokens = acc.completionTokens;
    return {
        llmCallCount: acc.llmCallCount,
        gatherPageSummaryCallCount: acc.gatherPageSummaryCallCount,
        toolCallCount: acc.toolCallCount,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        llmDurationMs: acc.llmDurationMs,
        toolDurationMs: acc.toolDurationMs,
        durationMs: Math.max(0, finishedAtMs - acc.startedAtMs),
        model: acc.model,
        toolsUsed: {
            names: [...acc.toolsUsed],
            qualityCounts: {
                high: acc.toolQualityCounts.high,
                medium: acc.toolQualityCounts.medium,
                low: acc.toolQualityCounts.low,
            },
            codeCounts: {
                INTENT_RECALL_FAILED: acc.machineCodeCounts.INTENT_RECALL_FAILED,
                SKILL_NOT_VISIBLE: acc.machineCodeCounts.SKILL_NOT_VISIBLE,
                SKILL_TOOLS_EMPTY: acc.machineCodeCounts.SKILL_TOOLS_EMPTY,
                SKILL_NOT_IN_SCOPE: acc.machineCodeCounts.SKILL_NOT_IN_SCOPE,
                SKILL_EXPAND_FAILED: acc.machineCodeCounts.SKILL_EXPAND_FAILED,
                TOOL_AUTH_FAILED: acc.machineCodeCounts.TOOL_AUTH_FAILED,
                TOOL_TIMEOUT: acc.machineCodeCounts.TOOL_TIMEOUT,
                TOOL_EMPTY_RESULT: acc.machineCodeCounts.TOOL_EMPTY_RESULT,
                TOOL_DOWNSTREAM_ERROR: acc.machineCodeCounts.TOOL_DOWNSTREAM_ERROR,
                LLM_TIMEOUT: acc.machineCodeCounts.LLM_TIMEOUT,
                LLM_RATE_LIMIT: acc.machineCodeCounts.LLM_RATE_LIMIT,
                WRITE_CONFIRMATION_REQUIRED: acc.machineCodeCounts.WRITE_CONFIRMATION_REQUIRED,
            },
        },
    };
}
exports.snapshotRunMetrics = snapshotRunMetrics;
function aggregateRunMetrics(snapshots) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    const toolsUsed = new Set();
    const toolQualityCounts = {
        high: 0,
        medium: 0,
        low: 0,
    };
    const machineCodeCounts = {
        INTENT_RECALL_FAILED: 0,
        SKILL_NOT_VISIBLE: 0,
        SKILL_TOOLS_EMPTY: 0,
        SKILL_NOT_IN_SCOPE: 0,
        SKILL_EXPAND_FAILED: 0,
        TOOL_AUTH_FAILED: 0,
        TOOL_TIMEOUT: 0,
        TOOL_EMPTY_RESULT: 0,
        TOOL_DOWNSTREAM_ERROR: 0,
        LLM_TIMEOUT: 0,
        LLM_RATE_LIMIT: 0,
        WRITE_CONFIRMATION_REQUIRED: 0,
    };
    let llmCallCount = 0;
    let gatherPageSummaryCallCount = 0;
    let toolCallCount = 0;
    let promptTokens = 0;
    let completionTokens = 0;
    let llmDurationMs = 0;
    let toolDurationMs = 0;
    let durationMs = 0;
    let model;
    for (const row of snapshots) {
        llmCallCount += row.llmCallCount;
        gatherPageSummaryCallCount += row.gatherPageSummaryCallCount;
        toolCallCount += row.toolCallCount;
        promptTokens += row.promptTokens;
        completionTokens += row.completionTokens;
        llmDurationMs += row.llmDurationMs;
        toolDurationMs += row.toolDurationMs;
        durationMs += row.durationMs;
        if ((_a = row.model) === null || _a === void 0 ? void 0 : _a.trim()) {
            model = row.model.trim();
        }
        for (const tool of row.toolsUsed.names) {
            toolsUsed.add(tool);
        }
        toolQualityCounts.high += row.toolsUsed.qualityCounts.high;
        toolQualityCounts.medium += row.toolsUsed.qualityCounts.medium;
        toolQualityCounts.low += row.toolsUsed.qualityCounts.low;
        machineCodeCounts.INTENT_RECALL_FAILED +=
            (_c = (_b = row.toolsUsed.codeCounts) === null || _b === void 0 ? void 0 : _b.INTENT_RECALL_FAILED) !== null && _c !== void 0 ? _c : 0;
        machineCodeCounts.SKILL_NOT_VISIBLE +=
            (_e = (_d = row.toolsUsed.codeCounts) === null || _d === void 0 ? void 0 : _d.SKILL_NOT_VISIBLE) !== null && _e !== void 0 ? _e : 0;
        machineCodeCounts.SKILL_TOOLS_EMPTY +=
            (_g = (_f = row.toolsUsed.codeCounts) === null || _f === void 0 ? void 0 : _f.SKILL_TOOLS_EMPTY) !== null && _g !== void 0 ? _g : 0;
        machineCodeCounts.SKILL_NOT_IN_SCOPE +=
            (_j = (_h = row.toolsUsed.codeCounts) === null || _h === void 0 ? void 0 : _h.SKILL_NOT_IN_SCOPE) !== null && _j !== void 0 ? _j : 0;
        machineCodeCounts.SKILL_EXPAND_FAILED +=
            (_l = (_k = row.toolsUsed.codeCounts) === null || _k === void 0 ? void 0 : _k.SKILL_EXPAND_FAILED) !== null && _l !== void 0 ? _l : 0;
        machineCodeCounts.TOOL_AUTH_FAILED +=
            (_o = (_m = row.toolsUsed.codeCounts) === null || _m === void 0 ? void 0 : _m.TOOL_AUTH_FAILED) !== null && _o !== void 0 ? _o : 0;
        machineCodeCounts.TOOL_TIMEOUT += (_q = (_p = row.toolsUsed.codeCounts) === null || _p === void 0 ? void 0 : _p.TOOL_TIMEOUT) !== null && _q !== void 0 ? _q : 0;
        machineCodeCounts.TOOL_EMPTY_RESULT +=
            (_s = (_r = row.toolsUsed.codeCounts) === null || _r === void 0 ? void 0 : _r.TOOL_EMPTY_RESULT) !== null && _s !== void 0 ? _s : 0;
        machineCodeCounts.TOOL_DOWNSTREAM_ERROR +=
            (_u = (_t = row.toolsUsed.codeCounts) === null || _t === void 0 ? void 0 : _t.TOOL_DOWNSTREAM_ERROR) !== null && _u !== void 0 ? _u : 0;
        machineCodeCounts.LLM_TIMEOUT += (_w = (_v = row.toolsUsed.codeCounts) === null || _v === void 0 ? void 0 : _v.LLM_TIMEOUT) !== null && _w !== void 0 ? _w : 0;
        machineCodeCounts.LLM_RATE_LIMIT +=
            (_y = (_x = row.toolsUsed.codeCounts) === null || _x === void 0 ? void 0 : _x.LLM_RATE_LIMIT) !== null && _y !== void 0 ? _y : 0;
    }
    return {
        llmCallCount,
        gatherPageSummaryCallCount,
        toolCallCount,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        llmDurationMs,
        toolDurationMs,
        durationMs,
        model,
        toolsUsed: {
            names: [...toolsUsed],
            qualityCounts: toolQualityCounts,
            codeCounts: machineCodeCounts,
        },
    };
}
exports.aggregateRunMetrics = aggregateRunMetrics;
function pickInt(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(0, Math.floor(value));
    }
    return null;
}
function resolveFinishReason(input) {
    if (input.status === 'failed') {
        return input.error ? 'error' : 'failed';
    }
    if (input.finishedEarly) {
        const intentStep = input.steps.find((step) => step.type === 'intent');
        const intentOutput = intentStep === null || intentStep === void 0 ? void 0 : intentStep.output;
        if (intentOutput &&
            typeof intentOutput === 'object' &&
            !Array.isArray(intentOutput) &&
            'intentClear' in intentOutput &&
            intentOutput.intentClear === false) {
            return 'intent_unclear';
        }
        return 'completed_early';
    }
    return 'completed';
}
exports.resolveFinishReason = resolveFinishReason;
//# sourceMappingURL=run-metrics.util.js.map