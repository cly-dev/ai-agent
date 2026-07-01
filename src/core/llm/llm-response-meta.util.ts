function pickInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return null;
}

export function extractLlmTokenUsageFromResponseMeta(
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

export function resolveLlmModelNameFromResponseMeta(
  responseMeta?: Record<string, unknown>,
): string | null {
  return typeof responseMeta?.model_name === 'string'
    ? responseMeta.model_name
    : null;
}
