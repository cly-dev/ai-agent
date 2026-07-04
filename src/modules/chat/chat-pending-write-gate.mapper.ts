import type { WriteDraftPublic } from '../../core/draft-review/write-draft.types';
import {
  buildWriteDraftPublicListFromChatGate,
  resolveDraftRetryBudget,
} from '../../core/draft-review';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';

/** C 端 run-state / SSE 共用的挂起写门公开态。 */
export type PendingWriteGatePublicState = {
  runId: number;
  turnId: number;
  draftRetryCount: number;
  draftRetryMax: number | null;
  canRetry: boolean;
  writeDraft?: WriteDraftPublic;
  writeDrafts?: WriteDraftPublic[];
};

export function buildPendingWriteGatePublicState(
  pending: PendingWriteConfirmationSnapshot,
): PendingWriteGatePublicState {
  const draftRetryCount = pending.resumeContext.draftRetryCount ?? 0;
  const budget = resolveDraftRetryBudget(draftRetryCount);
  const publicList = buildWriteDraftPublicListFromChatGate({
    toolCalls: pending.toolCalls,
    writeDraft: pending.writeDraft,
    writeDrafts: pending.writeDrafts,
    observations: pending.resumeContext.toolObservations,
    confirmedPreviewSerialized:
      pending.resumeContext.confirmedPreviewSerialized,
    draftRetryCount,
  });
  return {
    runId: pending.runId,
    turnId: pending.turnId,
    draftRetryCount: budget.used,
    draftRetryMax: budget.max,
    canRetry: budget.canRetry,
    ...(publicList[0] ? { writeDraft: publicList[0] } : {}),
    ...(publicList.length > 1 ? { writeDrafts: publicList } : {}),
  };
}
