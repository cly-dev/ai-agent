import {
  buildWriteDraftPublicListFromChatGate,
  resolveDraftRetryBudget,
} from '../../core/draft-review';
import {
  buildEditPolicyGateFields,
  resolveWriteDraftEditPoliciesForPublicDrafts,
} from '../../core/draft-review/resolve-write-draft-edit-policies.util';
import type { WriteToolPolicyRow } from '../../core/draft-review/load-write-tools-for-policy.util';
import type { DraftReviewWriteToolLike } from '../../core/draft-review/draft-review.types';
import type {
  WriteDraftEditPolicy,
  WriteDraftPublic,
} from '../../core/draft-review/write-draft.types';
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
  editPolicy?: WriteDraftEditPolicy | null;
  editPolicies?: WriteDraftEditPolicy[];
};

export function buildPendingWriteGatePublicState(
  pending: PendingWriteConfirmationSnapshot,
  writeToolsById?: Map<number, WriteToolPolicyRow>,
  scopedTools?: DraftReviewWriteToolLike[],
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
  const editPolicies = resolveWriteDraftEditPoliciesForPublicDrafts(
    publicList,
    { writeToolsById, scopedTools },
  );
  return {
    runId: pending.runId,
    turnId: pending.turnId,
    draftRetryCount: budget.used,
    draftRetryMax: budget.max,
    canRetry: budget.canRetry,
    ...(publicList[0] ? { writeDraft: publicList[0] } : {}),
    ...(publicList.length > 1 ? { writeDrafts: publicList } : {}),
    ...buildEditPolicyGateFields(editPolicies),
  };
}
