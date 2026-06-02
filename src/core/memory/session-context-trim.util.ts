import type { SessionContextTurn } from './session-context.types';

/** 软裁剪：去掉已纳入 compressedHistorySummary 的 turn（按 messageId 水位）。 */
export function trimTurnsByCompressedWatermark(
  turns: SessionContextTurn[],
  compressedUpToMessageId: number | undefined,
): SessionContextTurn[] {
  if (compressedUpToMessageId == null) {
    return turns;
  }
  return turns.filter((turn) => turn.messageId > compressedUpToMessageId);
}
