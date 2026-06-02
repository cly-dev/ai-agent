import type { WorkingMemoryState } from './session-context.types';

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

export function formatWorkingMemoryFactsForCompression(
  workingMemory: WorkingMemoryState | undefined,
): string | null {
  if (!workingMemory) {
    return null;
  }
  const parts: string[] = [];
  if (workingMemory.facts.length > 0) {
    const lines = workingMemory.facts
      .slice(-16)
      .map((f) => `- ${f.key}: ${f.value}`);
    parts.push(`工作记忆 facts（权威，摘要不得否定或推翻）：\n${lines.join('\n')}`);
  }
  const shopId = workingMemory.entities?.xShopId;
  if (shopId != null && String(shopId).trim()) {
    parts.push(`当前会话 X-SHOP-ID（entities.xShopId）: ${String(shopId)}`);
  }
  if (workingMemory.lastToolSummary?.trim()) {
    parts.push(`最近工具结论: ${workingMemory.lastToolSummary.trim()}`);
  }
  return parts.length > 0 ? parts.join('\n\n') : null;
}
