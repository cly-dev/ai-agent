import {
  estimateMessagesTokens,
  estimateTextTokens,
} from '../../llm/message-token-budget.util';
import type { LlmChatMessage } from '../../llm/llm.types';
import type { AgentMachineCode } from './agent-run-user-messages.util';

/** 单次 AgentRun / MessageTurn 执行过程的用量累加器。 */
export type RunMetricsAccumulator = {
  llmCallCount: number;
  gatherPageSummaryCallCount: number;
  toolCallCount: number;
  promptTokens: number;
  completionTokens: number;
  llmDurationMs: number;
  toolDurationMs: number;
  model?: string;
  toolsUsed: Set<string>;
  toolQualityCounts: {
    high: number;
    medium: number;
    low: number;
  };
  machineCodeCounts: Record<AgentMachineCode, number>;
  startedAtMs: number;
};

export type RunMetricsSnapshot = {
  llmCallCount: number;
  gatherPageSummaryCallCount: number;
  toolCallCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  llmDurationMs: number;
  toolDurationMs: number;
  durationMs: number;
  model?: string;
  toolsUsed: {
    names: string[];
    qualityCounts: {
      high: number;
      medium: number;
      low: number;
    };
    codeCounts: Record<AgentMachineCode, number>;
  };
};

export function createRunMetricsAccumulator(): RunMetricsAccumulator {
  return {
    llmCallCount: 0,
    gatherPageSummaryCallCount: 0,
    toolCallCount: 0,
    promptTokens: 0,
    completionTokens: 0,
    llmDurationMs: 0,
    toolDurationMs: 0,
    toolsUsed: new Set<string>(),
    toolQualityCounts: {
      high: 0,
      medium: 0,
      low: 0,
    },
    machineCodeCounts: {
      INTENT_RECALL_FAILED: 0,
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

export function recordGatherPageSummaryLlmUsage(
  acc: RunMetricsAccumulator,
  input: {
    messages: LlmChatMessage[];
    outputText: string;
    durationMs: number;
    model?: string;
    responseMeta?: Record<string, unknown>;
  },
): void {
  acc.gatherPageSummaryCallCount += 1;
  recordLlmUsage(acc, input);
}

export function recordLlmUsage(
  acc: RunMetricsAccumulator,
  input: {
    messages: LlmChatMessage[];
    outputText: string;
    durationMs: number;
    model?: string;
    responseMeta?: Record<string, unknown>;
  },
): void {
  acc.llmCallCount += 1;
  acc.llmDurationMs += Math.max(0, input.durationMs);
  if (input.model?.trim()) {
    acc.model = input.model.trim();
  }
  const usage = extractTokenUsage(input.responseMeta);
  if (usage) {
    acc.promptTokens += usage.promptTokens;
    acc.completionTokens += usage.completionTokens;
    return;
  }
  acc.promptTokens += estimateMessagesTokens(input.messages);
  acc.completionTokens += estimateTextTokens(input.outputText);
}

export function recordToolUsage(
  acc: RunMetricsAccumulator,
  input: { name: string; latencyMs: number; quality?: 'high' | 'medium' | 'low' },
): void {
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

export function recordMachineCodeUsage(
  acc: RunMetricsAccumulator,
  code: AgentMachineCode | null | undefined,
): void {
  if (!code) {
    return;
  }
  acc.machineCodeCounts[code] += 1;
}

export function snapshotRunMetrics(
  acc: RunMetricsAccumulator,
  finishedAtMs = Date.now(),
): RunMetricsSnapshot {
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
        TOOL_AUTH_FAILED: acc.machineCodeCounts.TOOL_AUTH_FAILED,
        TOOL_TIMEOUT: acc.machineCodeCounts.TOOL_TIMEOUT,
        TOOL_EMPTY_RESULT: acc.machineCodeCounts.TOOL_EMPTY_RESULT,
        TOOL_DOWNSTREAM_ERROR: acc.machineCodeCounts.TOOL_DOWNSTREAM_ERROR,
        LLM_TIMEOUT: acc.machineCodeCounts.LLM_TIMEOUT,
        LLM_RATE_LIMIT: acc.machineCodeCounts.LLM_RATE_LIMIT,
        WRITE_CONFIRMATION_REQUIRED:
          acc.machineCodeCounts.WRITE_CONFIRMATION_REQUIRED,
      },
    },
  };
}

export function aggregateRunMetrics(
  snapshots: RunMetricsSnapshot[],
): RunMetricsSnapshot {
  const toolsUsed = new Set<string>();
  const toolQualityCounts = {
    high: 0,
    medium: 0,
    low: 0,
  };
  const machineCodeCounts: Record<AgentMachineCode, number> = {
    INTENT_RECALL_FAILED: 0,
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
  let model: string | undefined;
  for (const row of snapshots) {
    llmCallCount += row.llmCallCount;
    gatherPageSummaryCallCount += row.gatherPageSummaryCallCount;
    toolCallCount += row.toolCallCount;
    promptTokens += row.promptTokens;
    completionTokens += row.completionTokens;
    llmDurationMs += row.llmDurationMs;
    toolDurationMs += row.toolDurationMs;
    durationMs += row.durationMs;
    if (row.model?.trim()) {
      model = row.model.trim();
    }
    for (const tool of row.toolsUsed.names) {
      toolsUsed.add(tool);
    }
    toolQualityCounts.high += row.toolsUsed.qualityCounts.high;
    toolQualityCounts.medium += row.toolsUsed.qualityCounts.medium;
    toolQualityCounts.low += row.toolsUsed.qualityCounts.low;
    machineCodeCounts.INTENT_RECALL_FAILED +=
      row.toolsUsed.codeCounts?.INTENT_RECALL_FAILED ?? 0;
    machineCodeCounts.TOOL_AUTH_FAILED +=
      row.toolsUsed.codeCounts?.TOOL_AUTH_FAILED ?? 0;
    machineCodeCounts.TOOL_TIMEOUT += row.toolsUsed.codeCounts?.TOOL_TIMEOUT ?? 0;
    machineCodeCounts.TOOL_EMPTY_RESULT +=
      row.toolsUsed.codeCounts?.TOOL_EMPTY_RESULT ?? 0;
    machineCodeCounts.TOOL_DOWNSTREAM_ERROR +=
      row.toolsUsed.codeCounts?.TOOL_DOWNSTREAM_ERROR ?? 0;
    machineCodeCounts.LLM_TIMEOUT += row.toolsUsed.codeCounts?.LLM_TIMEOUT ?? 0;
    machineCodeCounts.LLM_RATE_LIMIT +=
      row.toolsUsed.codeCounts?.LLM_RATE_LIMIT ?? 0;
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

function extractTokenUsage(
  responseMeta?: Record<string, unknown>,
): { promptTokens: number; completionTokens: number } | null {
  if (!responseMeta) {
    return null;
  }
  const raw =
    responseMeta.token_usage ??
    responseMeta.usage ??
    responseMeta.tokenUsage;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const prompt =
    pickInt(row.prompt_tokens) ??
    pickInt(row.input_tokens) ??
    pickInt(row.promptTokens);
  const completion =
    pickInt(row.completion_tokens) ??
    pickInt(row.output_tokens) ??
    pickInt(row.completionTokens);
  if (prompt == null && completion == null) {
    return null;
  }
  return {
    promptTokens: prompt ?? 0,
    completionTokens: completion ?? 0,
  };
}

function pickInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return null;
}

export function resolveFinishReason(input: {
  status: 'running' | 'success' | 'failed';
  steps: Array<{ type: string; output?: unknown }>;
  finishedEarly: boolean;
  error?: string;
}): string {
  if (input.status === 'failed') {
    return input.error ? 'error' : 'failed';
  }
  if (input.finishedEarly) {
    const intentStep = input.steps.find((step) => step.type === 'intent');
    const intentOutput = intentStep?.output;
    if (
      intentOutput &&
      typeof intentOutput === 'object' &&
      !Array.isArray(intentOutput) &&
      'intentClear' in intentOutput &&
      (intentOutput as { intentClear?: boolean }).intentClear === false
    ) {
      return 'intent_unclear';
    }
    return 'completed_early';
  }
  return 'completed';
}
