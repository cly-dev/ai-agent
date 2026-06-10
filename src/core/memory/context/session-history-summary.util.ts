import { formatGoaForHistoryCompression } from '../goa/session-goa-projection.util';
import type { SessionGoaPayload } from '../goa/session-goa.types';

const REJECT_PATTERNS = [
  /redacted_thinking/i,
  /<\s*think\s*>/i,
  /<\s*\/\s*think\s*>/i,
];

export function isSessionHistorySummaryAcceptable(summary: string): boolean {
  const text = summary.trim();
  if (!text) {
    return false;
  }
  if (text.length < 8) {
    return false;
  }
  return !REJECT_PATTERNS.some((pattern) => pattern.test(text));
}

export function formatSessionMemoryForCompression(
  goa: SessionGoaPayload,
): string | null {
  const block = formatGoaForHistoryCompression(goa).trim();
  return block.length > 0 ? block : null;
}
