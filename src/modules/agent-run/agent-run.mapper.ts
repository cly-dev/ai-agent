import type {
  AgentRunDetailRow,
  AgentRunResponse,
  ToolMachineCodeCounts,
  ToolQualityCounts,
} from './agent-run.types';

function normalizeToolsUsed(value: unknown): string[] | null {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const names = (value as { names?: unknown }).names;
    if (Array.isArray(names)) {
      return names.filter((item): item is string => typeof item === 'string');
    }
  }
  return null;
}

function normalizeToolQualityCounts(value: unknown): ToolQualityCounts | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const row = value as {
    qualityCounts?: { high?: unknown; medium?: unknown; low?: unknown };
  };
  const quality = row.qualityCounts;
  if (!quality || typeof quality !== 'object' || Array.isArray(quality)) {
    return null;
  }
  const high =
    typeof quality.high === 'number' && Number.isFinite(quality.high)
      ? Math.max(0, Math.floor(quality.high))
      : 0;
  const medium =
    typeof quality.medium === 'number' && Number.isFinite(quality.medium)
      ? Math.max(0, Math.floor(quality.medium))
      : 0;
  const low =
    typeof quality.low === 'number' && Number.isFinite(quality.low)
      ? Math.max(0, Math.floor(quality.low))
      : 0;
  return { high, medium, low };
}

function normalizeToolMachineCodeCounts(
  value: unknown,
): ToolMachineCodeCounts | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const row = value as {
    codeCounts?: {
      INTENT_RECALL_FAILED?: unknown;
      TOOL_AUTH_FAILED?: unknown;
      TOOL_TIMEOUT?: unknown;
      TOOL_EMPTY_RESULT?: unknown;
      TOOL_DOWNSTREAM_ERROR?: unknown;
      LLM_TIMEOUT?: unknown;
      LLM_RATE_LIMIT?: unknown;
    };
  };
  const counts = row.codeCounts;
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) {
    return null;
  }
  const asInt = (num: unknown): number =>
    typeof num === 'number' && Number.isFinite(num)
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

export function toAgentRunResponse(row: AgentRunDetailRow): AgentRunResponse {
  return {
    ...row,
    toolsUsed: normalizeToolsUsed(row.toolsUsed),
    toolQualityCounts: normalizeToolQualityCounts(row.toolsUsed),
    toolMachineCodeCounts: normalizeToolMachineCodeCounts(row.toolsUsed),
  };
}

export function toAgentRunResponseList(rows: AgentRunDetailRow[]): AgentRunResponse[] {
  return rows.map(toAgentRunResponse);
}
