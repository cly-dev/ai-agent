function normalizeObservationPayload(output: unknown): unknown {
  if (typeof output !== 'string') {
    return output;
  }
  const trimmed = output.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return output;
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return output;
  }
}

/** Successful tool response with an empty list container (e.g. `{ data: [] }`). */
export function isEmptyListToolObservation(output: unknown): boolean {
  const payload = normalizeObservationPayload(output);
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    return Array.isArray(payload) && payload.length === 0;
  }
  const row = payload as Record<string, unknown>;
  const data = row.data ?? row.list ?? row.items ?? row.records;
  if (Array.isArray(data)) {
    return data.length === 0;
  }
  return false;
}

export function observationsAreOnlyEmptyLists(
  observations: Array<{ output: unknown }>,
): boolean {
  return (
    observations.length > 0 &&
    observations.every((row) => isEmptyListToolObservation(row.output))
  );
}

/**
 * When tool observations exist but the model replied with generic onboarding text
 * (bullet capability list, no payload cues), prefer summarize over raw llmText.
 */
export function shouldPreferSummarizeOverObservedTools(
  llmText: string,
  observations: Array<{ output: unknown }>,
): boolean {
  if (observations.length === 0) {
    return false;
  }
  if (observationsAreOnlyEmptyLists(observations)) {
    return true;
  }
  const trimmed = llmText.trim();
  if (!trimmed) {
    return true;
  }
  const bulletLines = trimmed.match(/^\s*[-*•]\s+\S+/gm);
  const hasCapabilityList = bulletLines != null && bulletLines.length >= 2;
  const hasPayloadCue =
    /[{[\]}]|"data"|"items"|"records"|"total"|"count"|\b(id|sku|status)\b/i.test(
      trimmed,
    );
  if (hasCapabilityList && !hasPayloadCue) {
    return true;
  }
  const endsWithOffer =
    /\?\s*$/.test(trimmed) &&
    /\b(help|assist|can i|how may|what can|anything else)\b/i.test(trimmed);
  return endsWithOffer && !hasPayloadCue && trimmed.length >= 40;
}
