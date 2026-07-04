import type { WriteDraftPublic } from '../../core/draft-review/write-draft.types';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';
export type PendingWriteGatePublicState = {
    runId: number;
    turnId: number;
    draftRetryCount: number;
    draftRetryMax: number | null;
    canRetry: boolean;
    writeDraft?: WriteDraftPublic;
    writeDrafts?: WriteDraftPublic[];
};
export declare function buildPendingWriteGatePublicState(pending: PendingWriteConfirmationSnapshot): PendingWriteGatePublicState;
