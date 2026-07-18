import type { WriteDraft } from '../draft-review/write-draft.types';
import type { ToolExecutionResult } from '../tool-engine/tool-engine.types';

const DEFAULT_STRING_PREVIEW = 240;
const DEFAULT_PROMPT_MESSAGE_MAX_CHARS = 2000;
const DEFAULT_LLM_OUTPUT_MAX_CHARS = 4000;
const DEFAULT_MAX_KEYS = 40;

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars)}…`;
}

/** 审计用长文本截断（提示词 / LLM 原文）。 */
export function summarizeTextForAudit(
  text: string | null | undefined,
  maxChars = DEFAULT_STRING_PREVIEW,
): string | null {
  if (text == null || text.length === 0) {
    return null;
  }
  return truncateText(text, maxChars);
}

export function summarizePromptMessagesForAudit(
  messages: Array<{ role: string; content: string }>,
  options?: { maxMessages?: number; maxCharsPerMessage?: number },
): Array<{ role: string; content: string; contentLength: number }> {
  const maxMessages = options?.maxMessages ?? 32;
  const maxCharsPerMessage =
    options?.maxCharsPerMessage ?? DEFAULT_PROMPT_MESSAGE_MAX_CHARS;
  return messages.slice(-maxMessages).map((msg) => ({
    role: msg.role,
    content: truncateText(msg.content ?? '', maxCharsPerMessage),
    contentLength: (msg.content ?? '').length,
  }));
}

export function summarizeToolCallForAudit(input: {
  name: string;
  arguments: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    name: input.name,
    arguments: summarizeRecordForAudit(input.arguments),
  };
}

export function buildLlmStepAudit(input: {
  promptMessages: Array<{ role: string; content: string }>;
  objectivePrefix?: string | null;
  nodeObjective?: string | null;
  systemPrompt?: string | null;
  fittedMessageCount?: number;
}): Record<string, unknown> {
  return {
    ...(input.systemPrompt
      ? { systemPrompt: summarizeTextForAudit(input.systemPrompt, DEFAULT_PROMPT_MESSAGE_MAX_CHARS) }
      : {}),
    ...(input.objectivePrefix
      ? { objectivePrefix: summarizeTextForAudit(input.objectivePrefix, DEFAULT_PROMPT_MESSAGE_MAX_CHARS) }
      : {}),
    ...(input.nodeObjective
      ? { nodeObjective: summarizeTextForAudit(input.nodeObjective, DEFAULT_PROMPT_MESSAGE_MAX_CHARS) }
      : {}),
    promptMessages: summarizePromptMessagesForAudit(input.promptMessages),
    ...(input.fittedMessageCount != null
      ? { fittedMessageCount: input.fittedMessageCount }
      : {}),
  };
}

export function buildLlmOutputStepAudit(input: {
  assistantText?: string | null;
  userFacingText?: string | null;
  toolCall?: { name: string; arguments: Record<string, unknown> } | null;
  structuredOutput?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.assistantText) {
    out.llmRawAssistantText = summarizeTextForAudit(
      input.assistantText,
      DEFAULT_LLM_OUTPUT_MAX_CHARS,
    );
    out.llmRawAssistantTextLength = input.assistantText.length;
  }
  if (input.userFacingText != null) {
    out.llmUserFacingText = summarizeTextForAudit(
      input.userFacingText,
      DEFAULT_LLM_OUTPUT_MAX_CHARS,
    );
    out.llmUserFacingTextLength = input.userFacingText.length;
  }
  if (input.toolCall) {
    out.rawToolCall = summarizeToolCallForAudit(input.toolCall);
  }
  if (input.structuredOutput) {
    out.llmStructuredOutput = summarizeRecordForAudit(input.structuredOutput);
  }
  return out;
}

/** 审计用任意 JSON 值摘要（工具响应 body / output）。 */
export function summarizeUnknownForAudit(value: unknown): unknown {
  return summarizeAuditValue(value, DEFAULT_LLM_OUTPUT_MAX_CHARS, 0);
}

export function buildToolCallRequestAudit(input: {
  toolName: string;
  toolId?: number | null;
  arguments: Record<string, unknown>;
  httpMethod?: string | null;
  httpPath?: string | null;
}): Record<string, unknown> {
  return {
    toolName: input.toolName,
    ...(input.toolId != null ? { toolId: input.toolId } : {}),
    argumentKeys: Object.keys(input.arguments),
    callArguments: summarizeRecordForAudit(input.arguments),
    ...(input.httpMethod ? { httpMethod: input.httpMethod } : {}),
    ...(input.httpPath ? { httpPath: input.httpPath } : {}),
  };
}

export function buildToolCallResultAudit(
  result: Pick<
    ToolExecutionResult,
    'toolId' | 'name' | 'output' | 'latency' | 'httpResponse'
  >,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    toolName: result.name,
    toolId: result.toolId,
    latencyMs: result.latency,
    toolOutput: summarizeUnknownForAudit(result.output),
  };
  const http = result.httpResponse;
  if (http) {
    out.httpStatus = http.status;
    out.httpOk = http.ok;
    out.httpStatusText = http.statusText;
    out.responseBodyPreview = summarizeTextForAudit(
      http.bodyText,
      DEFAULT_LLM_OUTPUT_MAX_CHARS,
    );
    out.responseBodyLength = http.bodyText.length;
  }
  return out;
}

export function buildToolCallErrorAudit(input: {
  toolName: string;
  toolId?: number | null;
  arguments?: Record<string, unknown>;
  error: string;
}): Record<string, unknown> {
  return {
    ...buildToolCallRequestAudit({
      toolName: input.toolName,
      toolId: input.toolId,
      arguments: input.arguments ?? {},
    }),
    error: summarizeTextForAudit(input.error, DEFAULT_LLM_OUTPUT_MAX_CHARS),
  };
}

function summarizeAuditValue(
  value: unknown,
  stringPreviewChars: number,
  depth: number,
): unknown {
  if (value == null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return truncateText(value, stringPreviewChars);
  }
  if (Array.isArray(value)) {
    return {
      _arrayLength: value.length,
      _preview: value
        .slice(0, 3)
        .map((row) => summarizeAuditValue(row, stringPreviewChars, depth + 1)),
    };
  }
  if (typeof value === 'object' && depth < 2) {
    return summarizeRecordForAudit(value as Record<string, unknown>, {
      maxKeys: 16,
      stringPreviewChars,
    });
  }
  return String(value);
}

/** 审计用参数摘要（截断长字符串，避免 steps 膨胀）。 */
export function summarizeRecordForAudit(
  value: Record<string, unknown>,
  options?: { maxKeys?: number; stringPreviewChars?: number },
): Record<string, unknown> {
  const maxKeys = options?.maxKeys ?? DEFAULT_MAX_KEYS;
  const stringPreviewChars = options?.stringPreviewChars ?? DEFAULT_STRING_PREVIEW;
  const entries = Object.entries(value);
  const out: Record<string, unknown> = {};
  for (const [key, raw] of entries.slice(0, maxKeys)) {
    out[key] = summarizeAuditValue(raw, stringPreviewChars, 0);
  }
  if (entries.length > maxKeys) {
    out._truncatedKeyCount = entries.length - maxKeys;
  }
  return out;
}

export function buildWriteDraftStepDetail(
  draft: Pick<
    WriteDraft,
    'version' | 'tool' | 'arguments' | 'presentation' | 'provenance'
  >,
): Record<string, unknown> {
  const summaryText = draft.presentation.summaryText ?? null;
  return {
    writeDraftVersion: draft.version,
    toolName: draft.tool.name,
    toolId: draft.tool.toolId ?? null,
    riskLevel: String(draft.tool.riskLevel),
    argumentKeys: Object.keys(draft.arguments),
    writeArguments: summarizeRecordForAudit(draft.arguments),
    summaryText,
    summaryTextLength: summaryText?.length ?? 0,
    previewBlocks: draft.presentation.previewBlocks.map((block) =>
      summarizeRecordForAudit(block as unknown as Record<string, unknown>, {
        maxKeys: 12,
        stringPreviewChars: DEFAULT_STRING_PREVIEW,
      }),
    ),
    draftRetryCount: draft.provenance.draftRetryCount,
    lastEvent: draft.provenance.lastEvent,
  };
}

export function buildWorkflowNodeCompleteAudit(
  action: string,
  nodeOutput: unknown,
): Record<string, unknown> {
  if (!nodeOutput || typeof nodeOutput !== 'object' || Array.isArray(nodeOutput)) {
    return {};
  }
  const row = nodeOutput as Record<string, unknown>;
  switch (action) {
    case 'present_mutation':
    case 'summarize': {
      const summaryText =
        typeof row.summaryText === 'string' ? row.summaryText : null;
      return {
        mode: row.mode ?? null,
        summaryTextLength: summaryText?.length ?? 0,
        summaryPreview: summaryText
          ? truncateText(summaryText, DEFAULT_STRING_PREVIEW)
          : null,
      };
    }
    case 'fetch_data':
      return {
        toolName: row.toolName ?? null,
        toolId: row.toolId ?? null,
        toolOutput:
          'output' in row ? summarizeUnknownForAudit(row.output) : null,
      };
    case 'write_data':
      return {
        toolName: row.tool ?? null,
        toolOutput:
          'output' in row ? summarizeUnknownForAudit(row.output) : null,
      };
    case 'compose_mutation':
      return {
        toolName: row.tool ?? null,
        toolId: row.toolId ?? null,
        argumentKeys:
          row.arguments && typeof row.arguments === 'object' && !Array.isArray(row.arguments)
            ? Object.keys(row.arguments as Record<string, unknown>)
            : [],
        writeArguments:
          row.arguments && typeof row.arguments === 'object' && !Array.isArray(row.arguments)
            ? summarizeRecordForAudit(row.arguments as Record<string, unknown>)
            : null,
      };
    case 'summarize_images':
      return {
        groupCount: row.groupCount ?? null,
        cellCount: row.cellCount ?? null,
      };
    default:
      return {};
  }
}
