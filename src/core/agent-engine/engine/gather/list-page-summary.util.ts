import { z } from 'zod';
import type { LlmChatMessage } from '../../../llm/llm.types';
import type { LlmService } from '../../../llm/llm.service';
import { PROMPT_KEYS } from '../../../prompt/prompt-template.keys';
import type { PromptRegistryService } from '../../../prompt/prompt-registry.service';
import { formatFieldLabelsForPrompt } from '../../../tool-engine/tool-output-projection.util';
import type { ListPageSummary } from './list-map-reduce.types';
import { recordGatherPageSummaryLlmUsage } from '../run-metrics.util';
import type { RunMetricsAccumulator } from '../run-metrics.util';
import { emitLlmPromptDebug } from '../llm-prompt-debug.util';

const PAGE_SUMMARY_ROW_STRING_MAX = 400;
const PAGE_SUMMARY_ROWS_JSON_MAX = 48_000;
const DEFAULT_MAP_LLM_MAX_CONCURRENT = 3;
const PAGE_SUMMARY_RAW_PREVIEW_MAX = 600;

/** Array shape avoids z.record → JSON Schema propertyNames (unsupported by some LLM APIs). */
const pageSummaryDistributionSchema = z.object({
  dimension: z.string(),
  counts: z.array(
    z.object({
      label: z.string(),
      count: z.number(),
    }),
  ),
});

const pageSummarySchema = z.object({
  keyFindings: z.array(z.string()),
  distributions: z.array(pageSummaryDistributionSchema).optional().default([]),
  notableExamples: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]).optional(),
        note: z.string(),
      }),
    )
    .optional()
    .default([]),
  dataQualityNotes: z.array(z.string()).optional().default([]),
});

export type PageSummaryLlmResult = z.infer<typeof pageSummarySchema>;

export type PageSummaryFailureReason =
  | 'structured_output_failed'
  | 'fallback_chat_failed'
  | 'json_parse_failed'
  | 'schema_validation_failed'
  | 'unexpected_exception';

export type PageSummaryLlmAttempt =
  | { ok: true; summary: PageSummaryLlmResult }
  | {
      ok: false;
      reason: PageSummaryFailureReason;
      detail: string;
      rawContentPreview?: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

export function resolveMapLlmMaxConcurrent(): number {
  return readPositiveIntEnv(
    'TOOL_LIST_MAP_LLM_MAX_CONCURRENT',
    DEFAULT_MAP_LLM_MAX_CONCURRENT,
  );
}

function truncateString(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function previewText(
  value: string,
  max = PAGE_SUMMARY_RAW_PREVIEW_MAX,
): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max)}…`;
}

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return String(error);
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

function sanitizeValueForPageSummary(value: unknown): unknown {
  if (typeof value === 'string') {
    return truncateString(value, PAGE_SUMMARY_ROW_STRING_MAX);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 8).map(sanitizeValueForPageSummary);
  }
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
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

export type PreparedPageSummaryRows = {
  rows: Record<string, unknown>[];
  originalRowCount: number;
  analyzedRowCount: number;
  rowsTruncatedForLlm: boolean;
};

export function prepareRowsForPageSummary(
  rows: Record<string, unknown>[],
): PreparedPageSummaryRows {
  const sanitized = rows.map((row) => {
    const out: Record<string, unknown> = {};
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

function tryParseJsonObject(value: string): Record<string, unknown> | null {
  const trimmed = value.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenceMatch ? fenceMatch[1].trim() : null, trimmed].filter(
    (row): row is string => row != null && row.length > 0,
  );

  for (const candidate of candidates) {
    if (candidate.startsWith('{')) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (isRecord(parsed)) {
          return parsed;
        }
      } catch {
        // try substring extraction below
      }
    }
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end <= start) {
      continue;
    }
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      // next candidate
    }
  }
  return null;
}

export type SummarizeListPageInput = {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  page: number;
  rows: Record<string, unknown>[];
  fieldLabels: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
  currentObjective?: string;
  runMetrics?: RunMetricsAccumulator;
  runId?: number;
  sessionId?: string;
  iteration?: number;
  toolName?: string;
  onDebugLog?: (message: string) => void;
};

function recordPageSummaryLlmMetrics(
  runMetrics: RunMetricsAccumulator | undefined,
  input: {
    messages: LlmChatMessage[];
    outputText: string;
    startedAtMs: number;
    model?: string;
    responseMeta?: Record<string, unknown>;
  },
): void {
  if (!runMetrics) {
    return;
  }
  recordGatherPageSummaryLlmUsage(runMetrics, {
    messages: input.messages,
    outputText: input.outputText,
    durationMs: Math.max(0, Date.now() - input.startedAtMs),
    model: input.model,
    responseMeta: input.responseMeta,
  });
}

function ignoreDebugLog(_message: string): void {
  void _message;
}

function emitPageSummaryFailureDebug(
  input: SummarizeListPageInput,
  messages: LlmChatMessage[],
  failure: Extract<PageSummaryLlmAttempt, { ok: false }>,
): void {
  const log = input.onDebugLog ?? ignoreDebugLog;
  const runId = input.runId ?? 0;
  const sessionId = input.sessionId ?? '-';
  const header = [
    `[GatherPageSummary] FAILED runId=${runId} page=${input.page}`,
    input.toolName ? `tool=${input.toolName}` : null,
    `reason=${failure.reason}`,
    `detail=${failure.detail}`,
    failure.rawContentPreview
      ? `rawPreview=${previewText(failure.rawContentPreview, 200)}`
      : null,
  ]
    .filter((line): line is string => line != null)
    .join(' ');
  log(header);

  if (runId > 0 && sessionId !== '-') {
    const debugFile = emitLlmPromptDebug(log, {
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
      log(
        `Gather page summary debug file runId=${runId} page=${input.page} path=${debugFile}`,
      );
    }
  }
}

function applyRowsTruncatedNote(
  summary: PageSummaryLlmResult,
  prepared: PreparedPageSummaryRows,
): PageSummaryLlmResult {
  if (!prepared.rowsTruncatedForLlm) {
    return summary;
  }
  return {
    ...summary,
    dataQualityNotes: [
      ...summary.dataQualityNotes,
      `LLM analyzed ${prepared.analyzedRowCount}/${prepared.originalRowCount} rows due to token budget.`,
    ],
  };
}

export async function summarizeListPageWithLlm(
  input: SummarizeListPageInput,
): Promise<PageSummaryLlmAttempt> {
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
  const systemPrompt = await input.promptRegistry.render(
    PROMPT_KEYS.AGENT_GATHER_PAGE_SUMMARY,
    input.scope,
  );
  const fieldLabelText = formatFieldLabelsForPrompt(
    input.fieldLabels,
    input.enumLabelsByPath ?? {},
    input.fieldDescriptions ?? {},
  );
  const rowsJson = JSON.stringify(prepared.rows);
  const messages: LlmChatMessage[] = [
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
        .filter((line): line is string => line != null && line.length > 0)
        .join('\n\n'),
    },
  ];

  const startedAtMs = Date.now();
  let structuredErrorDetail: string | undefined;

  try {
    const { model, messages: fittedMessages } =
      await input.llmService.createLangChainChatModelForMessages(messages, {
        maxTokens: 1024,
        budgetHints: { callKind: 'gather_page_summary', skipFit: true },
      });
    const structuredModel = model.withStructuredOutput(pageSummarySchema);
    const summary = (await structuredModel.invoke(
      fittedMessages,
    )) as PageSummaryLlmResult;
    const finalSummary = applyRowsTruncatedNote(summary, prepared);
    recordPageSummaryLlmMetrics(input.runMetrics, {
      messages,
      outputText: JSON.stringify(finalSummary),
      startedAtMs,
    });
    return { ok: true, summary: finalSummary };
  } catch (error) {
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
      responseMeta:
        result.raw != null &&
        typeof result.raw === 'object' &&
        !Array.isArray(result.raw)
          ? (result.raw as Record<string, unknown>)
          : undefined,
    });
    const rawContent = result.content ?? '';
    const parsed = tryParseJsonObject(rawContent);
    if (!parsed) {
      const failure: PageSummaryLlmAttempt = {
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
      const failure: PageSummaryLlmAttempt = {
        ok: false,
        reason: 'schema_validation_failed',
        detail: [
          structuredErrorDetail ? `structured: ${structuredErrorDetail}` : null,
          `zod: ${formatZodIssues(safe.error)}`,
        ]
          .filter((line): line is string => line != null)
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
  } catch (error) {
    const failure: PageSummaryLlmAttempt = {
      ok: false,
      reason: 'fallback_chat_failed',
      detail: [
        structuredErrorDetail ? `structured: ${structuredErrorDetail}` : null,
        `fallback: ${formatUnknownError(error)}`,
      ]
        .filter((line): line is string => line != null)
        .join('; '),
    };
    emitPageSummaryFailureDebug(input, messages, failure);
    return failure;
  }
}

export type PageSummaryScheduleInput = SummarizeListPageInput & {
  onScheduled?: (page: number) => void;
};

class AsyncSemaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  private async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.active += 1;
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

function isFailedPageSummaryAttempt(
  attempt: PageSummaryLlmAttempt,
): attempt is Extract<PageSummaryLlmAttempt, { ok: false }> {
  return attempt.ok === false;
}

function buildFailedPageSummary(
  page: number,
  rowCount: number,
  attempt: Extract<PageSummaryLlmAttempt, { ok: false }>,
): ListPageSummary {
  return {
    page,
    rowCount,
    error: 'page_summary_failed',
    errorDetail: `${attempt.reason}: ${attempt.detail}`,
  };
}

/** Pipeline: each page summary starts when scheduled; concurrency is bounded. */
export class ListPageSummaryPipeline {
  private readonly tasks: Promise<void>[] = [];
  private readonly summaries: ListPageSummary[] = [];
  private readonly semaphore: AsyncSemaphore;

  constructor(maxConcurrent = resolveMapLlmMaxConcurrent()) {
    this.semaphore = new AsyncSemaphore(maxConcurrent);
  }

  schedule(input: PageSummaryScheduleInput): void {
    input.onScheduled?.(input.page);
    const prepared = prepareRowsForPageSummary(input.rows);
    const task = this.semaphore.run(async () => {
      try {
        const attempt = await summarizeListPageWithLlm({
          ...input,
          rows: prepared.rows,
        });
        if (isFailedPageSummaryAttempt(attempt)) {
          this.summaries.push(
            buildFailedPageSummary(
              input.page,
              prepared.originalRowCount,
              attempt,
            ),
          );
          return;
        }
        this.summaries.push({
          page: input.page,
          rowCount: prepared.originalRowCount,
          summary: attempt.summary,
        });
      } catch (error) {
        const attempt: Extract<PageSummaryLlmAttempt, { ok: false }> = {
          ok: false,
          reason: 'unexpected_exception',
          detail: formatUnknownError(error),
        };
        emitPageSummaryFailureDebug(input, [], attempt);
        this.summaries.push(
          buildFailedPageSummary(
            input.page,
            prepared.originalRowCount,
            attempt,
          ),
        );
      }
    });
    this.tasks.push(task);
  }

  async awaitAll(): Promise<ListPageSummary[]> {
    await Promise.all(this.tasks);
    return [...this.summaries].sort((left, right) => left.page - right.page);
  }
}
