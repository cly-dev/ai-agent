import type {
  DetectClueItemResult,
  DetectCluesOutput,
} from '../workflow.types';

/** 规范化 detect LLM 输出：补全缺失 key、派生 matchedClueKeys、校正 value。 */
export function normalizeDetectCluesOutput(input: {
  configuredKeys: string[];
  rawClues: Array<Partial<DetectClueItemResult> & { key?: string }>;
}): DetectCluesOutput {
  const byKey = new Map<string, DetectClueItemResult>();
  for (const row of input.rawClues) {
    if (typeof row.key !== 'string' || !row.key.trim()) {
      continue;
    }
    const matched = row.matched === true;
    const confidenceRaw =
      typeof row.confidence === 'number' && Number.isFinite(row.confidence)
        ? row.confidence
        : 0;
    const confidence = Math.min(1, Math.max(0, confidenceRaw));
    const value =
      matched && typeof row.value === 'string' && row.value.trim()
        ? row.value.trim()
        : null;
    const reason =
      typeof row.reason === 'string' && row.reason.trim()
        ? row.reason.trim().slice(0, 500)
        : matched
          ? 'matched'
          : 'not matched';
    byKey.set(row.key, {
      key: row.key,
      matched,
      confidence,
      value,
      reason,
    });
  }

  const clues: DetectClueItemResult[] = input.configuredKeys.map((key) => {
    const existing = byKey.get(key);
    if (existing) {
      return existing;
    }
    return {
      key,
      matched: false,
      confidence: 0,
      value: null,
      reason: 'missing from model output',
    };
  });

  return {
    clues,
    matchedClueKeys: clues.filter((row) => row.matched).map((row) => row.key),
  };
}
