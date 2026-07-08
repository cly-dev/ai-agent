"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListPageSummaryPipeline = exports.summarizeListPageWithLlm = exports.prepareRowsForPageSummary = exports.resolveMapLlmMaxConcurrent = void 0;
const zod_1 = require("zod");
const prompt_template_keys_1 = require("../../../prompt/prompt-template.keys");
const tool_output_projection_util_1 = require("../../../tool-engine/tool-output-projection.util");
const run_metrics_util_1 = require("../run-metrics.util");
const llm_prompt_debug_util_1 = require("../llm-prompt-debug.util");
const PAGE_SUMMARY_ROW_STRING_MAX = 400;
const PAGE_SUMMARY_ROWS_JSON_MAX = 48000;
const DEFAULT_MAP_LLM_MAX_CONCURRENT = 3;
const PAGE_SUMMARY_RAW_PREVIEW_MAX = 600;
const pageSummaryDistributionSchema = zod_1.z.object({
    dimension: zod_1.z.string(),
    counts: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.string(),
        count: zod_1.z.number(),
    })),
});
const pageSummarySchema = zod_1.z.object({
    keyFindings: zod_1.z.array(zod_1.z.string()),
    distributions: zod_1.z.array(pageSummaryDistributionSchema).optional().default([]),
    notableExamples: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
        note: zod_1.z.string(),
    }))
        .optional()
        .default([]),
    dataQualityNotes: zod_1.z.array(zod_1.z.string()).optional().default([]),
});
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function readPositiveIntEnv(name, fallback) {
    var _a;
    const raw = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return fallback;
    }
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}
function resolveMapLlmMaxConcurrent() {
    return readPositiveIntEnv('TOOL_LIST_MAP_LLM_MAX_CONCURRENT', DEFAULT_MAP_LLM_MAX_CONCURRENT);
}
exports.resolveMapLlmMaxConcurrent = resolveMapLlmMaxConcurrent;
function truncateString(value, max) {
    return value.length > max ? `${value.slice(0, max)}…` : value;
}
function previewText(value, max = PAGE_SUMMARY_RAW_PREVIEW_MAX) {
    const trimmed = value.trim();
    if (trimmed.length <= max) {
        return trimmed;
    }
    return `${trimmed.slice(0, max)}…`;
}
function formatUnknownError(error) {
    if (error instanceof Error) {
        return error.message || error.name;
    }
    return String(error);
}
function formatZodIssues(error) {
    return error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');
}
function sanitizeValueForPageSummary(value) {
    if (typeof value === 'string') {
        return truncateString(value, PAGE_SUMMARY_ROW_STRING_MAX);
    }
    if (Array.isArray(value)) {
        return value.slice(0, 8).map(sanitizeValueForPageSummary);
    }
    if (isRecord(value)) {
        const out = {};
        let keys = 0;
        for (const [key, row] of Object.entries(value)) {
            if (keys >= 12) {
                break;
            }
            out[key] = sanitizeValueForPageSummary(row);
            keys += 1;
        }
        return out;
    }
    return value;
}
function prepareRowsForPageSummary(rows) {
    const sanitized = rows.map((row) => {
        const out = {};
        for (const [key, value] of Object.entries(row)) {
            out[key] = sanitizeValueForPageSummary(value);
        }
        return out;
    });
    let analyzed = sanitized;
    let payload = JSON.stringify(analyzed);
    if (payload.length > PAGE_SUMMARY_ROWS_JSON_MAX) {
        let limit = analyzed.length;
        while (limit > 1) {
            limit = Math.max(1, Math.floor(limit * 0.7));
            payload = JSON.stringify(analyzed.slice(0, limit));
            if (payload.length <= PAGE_SUMMARY_ROWS_JSON_MAX) {
                analyzed = analyzed.slice(0, limit);
                break;
            }
        }
        if (payload.length > PAGE_SUMMARY_ROWS_JSON_MAX) {
            analyzed = analyzed.slice(0, 1);
        }
    }
    return {
        rows: analyzed,
        originalRowCount: rows.length,
        analyzedRowCount: analyzed.length,
        rowsTruncatedForLlm: analyzed.length < rows.length,
    };
}
exports.prepareRowsForPageSummary = prepareRowsForPageSummary;
function tryParseJsonObject(value) {
    const trimmed = value.trim();
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidates = [fenceMatch ? fenceMatch[1].trim() : null, trimmed].filter((row) => row != null && row.length > 0);
    for (const candidate of candidates) {
        if (candidate.startsWith('{')) {
            try {
                const parsed = JSON.parse(candidate);
                if (isRecord(parsed)) {
                    return parsed;
                }
            }
            catch (_a) {
            }
        }
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start < 0 || end <= start) {
            continue;
        }
        try {
            const parsed = JSON.parse(candidate.slice(start, end + 1));
            if (isRecord(parsed)) {
                return parsed;
            }
        }
        catch (_b) {
        }
    }
    return null;
}
function recordPageSummaryLlmMetrics(runMetrics, input) {
    if (!runMetrics) {
        return;
    }
    (0, run_metrics_util_1.recordGatherPageSummaryLlmUsage)(runMetrics, {
        messages: input.messages,
        outputText: input.outputText,
        durationMs: Math.max(0, Date.now() - input.startedAtMs),
        model: input.model,
        responseMeta: input.responseMeta,
    });
}
function ignoreDebugLog(_message) {
    void _message;
}
function emitPageSummaryFailureDebug(input, messages, failure) {
    var _a, _b, _c;
    const log = (_a = input.onDebugLog) !== null && _a !== void 0 ? _a : ignoreDebugLog;
    const runId = (_b = input.runId) !== null && _b !== void 0 ? _b : 0;
    const sessionId = (_c = input.sessionId) !== null && _c !== void 0 ? _c : '-';
    const header = [
        `[GatherPageSummary] FAILED runId=${runId} page=${input.page}`,
        input.toolName ? `tool=${input.toolName}` : null,
        `reason=${failure.reason}`,
        `detail=${failure.detail}`,
        failure.rawContentPreview
            ? `rawPreview=${previewText(failure.rawContentPreview, 200)}`
            : null,
    ]
        .filter((line) => line != null)
        .join(' ');
    log(header);
    if (runId > 0 && sessionId !== '-') {
        const debugFile = (0, llm_prompt_debug_util_1.emitLlmPromptDebug)(log, {
            runId,
            sessionId,
            phase: 'gather_page_summary',
            step: input.iteration,
            iteration: input.iteration,
            meta: {
                page: input.page,
                toolName: input.toolName,
                reason: failure.reason,
                detail: failure.detail,
                rawContentPreview: failure.rawContentPreview,
            },
            messages,
        });
        if (debugFile) {
            log(`Gather page summary debug file runId=${runId} page=${input.page} path=${debugFile}`);
        }
    }
}
function applyRowsTruncatedNote(summary, prepared) {
    if (!prepared.rowsTruncatedForLlm) {
        return summary;
    }
    return Object.assign(Object.assign({}, summary), { dataQualityNotes: [
            ...summary.dataQualityNotes,
            `LLM analyzed ${prepared.analyzedRowCount}/${prepared.originalRowCount} rows due to token budget.`,
        ] });
}
async function summarizeListPageWithLlm(input) {
    var _a, _b, _c;
    if (input.rows.length === 0) {
        return {
            ok: true,
            summary: {
                keyFindings: [],
                distributions: [],
                notableExamples: [],
                dataQualityNotes: ['Empty page'],
            },
        };
    }
    const prepared = prepareRowsForPageSummary(input.rows);
    const systemPrompt = await input.promptRegistry.render(prompt_template_keys_1.PROMPT_KEYS.AGENT_GATHER_PAGE_SUMMARY, input.scope);
    const fieldLabelText = (0, tool_output_projection_util_1.formatFieldLabelsForPrompt)(input.fieldLabels, (_a = input.enumLabelsByPath) !== null && _a !== void 0 ? _a : {}, (_b = input.fieldDescriptions) !== null && _b !== void 0 ? _b : {});
    const rowsJson = JSON.stringify(prepared.rows);
    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: [
                input.currentObjective
                    ? `Analysis objective: ${input.currentObjective}`
                    : null,
                `Page: ${input.page}`,
                `Row count (API page): ${prepared.originalRowCount}`,
                prepared.rowsTruncatedForLlm
                    ? `Rows analyzed in this summary: ${prepared.analyzedRowCount} (truncated from ${prepared.originalRowCount} for token budget)`
                    : null,
                fieldLabelText ? `Field labels:\n${fieldLabelText}` : null,
                `Rows JSON:\n${rowsJson}`,
            ]
                .filter((line) => line != null && line.length > 0)
                .join('\n\n'),
        },
    ];
    const startedAtMs = Date.now();
    let structuredErrorDetail;
    try {
        const { model, messages: fittedMessages } = await input.llmService.createLangChainChatModelForMessages(messages, {
            maxTokens: 1024,
            budgetHints: { callKind: 'gather_page_summary', skipFit: true },
        });
        const structuredModel = model.withStructuredOutput(pageSummarySchema);
        const summary = (await structuredModel.invoke(fittedMessages));
        const finalSummary = applyRowsTruncatedNote(summary, prepared);
        recordPageSummaryLlmMetrics(input.runMetrics, {
            messages,
            outputText: JSON.stringify(finalSummary),
            startedAtMs,
        });
        return { ok: true, summary: finalSummary };
    }
    catch (error) {
        structuredErrorDetail = formatUnknownError(error);
    }
    try {
        const result = await input.llmService.chat({
            messages,
            tools: [],
            maxTokens: 1024,
            budgetHints: { callKind: 'gather_page_summary', skipFit: true },
        });
        recordPageSummaryLlmMetrics(input.runMetrics, {
            messages,
            outputText: result.content,
            startedAtMs,
            model: result.model,
            responseMeta: result.raw != null &&
                typeof result.raw === 'object' &&
                !Array.isArray(result.raw)
                ? result.raw
                : undefined,
        });
        const rawContent = (_c = result.content) !== null && _c !== void 0 ? _c : '';
        const parsed = tryParseJsonObject(rawContent);
        if (!parsed) {
            const failure = {
                ok: false,
                reason: 'json_parse_failed',
                detail: structuredErrorDetail
                    ? `structured: ${structuredErrorDetail}; fallback response is not JSON`
                    : 'fallback response is not JSON',
                rawContentPreview: rawContent,
            };
            emitPageSummaryFailureDebug(input, messages, failure);
            return failure;
        }
        const safe = pageSummarySchema.safeParse(parsed);
        if (!safe.success) {
            const failure = {
                ok: false,
                reason: 'schema_validation_failed',
                detail: [
                    structuredErrorDetail ? `structured: ${structuredErrorDetail}` : null,
                    `zod: ${formatZodIssues(safe.error)}`,
                ]
                    .filter((line) => line != null)
                    .join('; '),
                rawContentPreview: rawContent,
            };
            emitPageSummaryFailureDebug(input, messages, failure);
            return failure;
        }
        return {
            ok: true,
            summary: applyRowsTruncatedNote(safe.data, prepared),
        };
    }
    catch (error) {
        const failure = {
            ok: false,
            reason: 'fallback_chat_failed',
            detail: [
                structuredErrorDetail ? `structured: ${structuredErrorDetail}` : null,
                `fallback: ${formatUnknownError(error)}`,
            ]
                .filter((line) => line != null)
                .join('; '),
        };
        emitPageSummaryFailureDebug(input, messages, failure);
        return failure;
    }
}
exports.summarizeListPageWithLlm = summarizeListPageWithLlm;
class AsyncSemaphore {
    constructor(max) {
        this.max = max;
        this.active = 0;
        this.queue = [];
    }
    async acquire() {
        if (this.active < this.max) {
            this.active += 1;
            return;
        }
        await new Promise((resolve) => {
            this.queue.push(resolve);
        });
        this.active += 1;
    }
    release() {
        this.active = Math.max(0, this.active - 1);
        const next = this.queue.shift();
        if (next) {
            next();
        }
    }
    async run(fn) {
        await this.acquire();
        try {
            return await fn();
        }
        finally {
            this.release();
        }
    }
}
function isFailedPageSummaryAttempt(attempt) {
    return attempt.ok === false;
}
function buildFailedPageSummary(page, rowCount, attempt) {
    return {
        page,
        rowCount,
        error: 'page_summary_failed',
        errorDetail: `${attempt.reason}: ${attempt.detail}`,
    };
}
class ListPageSummaryPipeline {
    constructor(maxConcurrent = resolveMapLlmMaxConcurrent()) {
        this.tasks = [];
        this.summaries = [];
        this.semaphore = new AsyncSemaphore(maxConcurrent);
    }
    schedule(input) {
        var _a;
        (_a = input.onScheduled) === null || _a === void 0 ? void 0 : _a.call(input, input.page);
        const prepared = prepareRowsForPageSummary(input.rows);
        const task = this.semaphore.run(async () => {
            try {
                const attempt = await summarizeListPageWithLlm(Object.assign(Object.assign({}, input), { rows: prepared.rows }));
                if (isFailedPageSummaryAttempt(attempt)) {
                    this.summaries.push(buildFailedPageSummary(input.page, prepared.originalRowCount, attempt));
                    return;
                }
                this.summaries.push({
                    page: input.page,
                    rowCount: prepared.originalRowCount,
                    summary: attempt.summary,
                });
            }
            catch (error) {
                const attempt = {
                    ok: false,
                    reason: 'unexpected_exception',
                    detail: formatUnknownError(error),
                };
                emitPageSummaryFailureDebug(input, [], attempt);
                this.summaries.push(buildFailedPageSummary(input.page, prepared.originalRowCount, attempt));
            }
        });
        this.tasks.push(task);
    }
    async awaitAll() {
        await Promise.all(this.tasks);
        return [...this.summaries].sort((left, right) => left.page - right.page);
    }
}
exports.ListPageSummaryPipeline = ListPageSummaryPipeline;
//# sourceMappingURL=list-page-summary.util.js.map