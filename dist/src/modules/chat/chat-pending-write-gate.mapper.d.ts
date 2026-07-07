import type { WriteToolPolicyRow } from '../../core/draft-review/load-write-tools-for-policy.util';
import type { DraftReviewWriteToolLike } from '../../core/draft-review/draft-review.types';
import type { WriteDraftEditPolicy, WriteDraftPublic } from '../../core/draft-review/write-draft.types';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';
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
export declare function buildPendingWriteGatePublicState(pending: PendingWriteConfirmationSnapshot, writeToolsById?: Map<number, WriteToolPolicyRow>, scopedTools?: DraftReviewWriteToolLike[]): PendingWriteGatePublicState;
