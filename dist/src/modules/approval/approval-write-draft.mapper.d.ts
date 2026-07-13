import type { DraftReviewWriteToolLike } from '../../core/draft-review/draft-review.types';
import type { WriteDraftEditPolicy, WriteDraftPublic } from '../../core/draft-review/write-draft.types';
export type ApprovalWriteDraftPayload = {
    writeDraft: WriteDraftPublic;
    editPolicy: WriteDraftEditPolicy | null;
};
export declare function resolveApprovalRowToolId(row: {
    resumeSnapshot: unknown;
}): number | null;
export declare function extractWriteDraftPublicFromApprovalRow(row: {
    resumeSnapshot: unknown;
    summary?: string | null;
    previewBlocks?: unknown;
}): WriteDraftPublic;
export declare function buildApprovalWriteDraftPayload(row: {
    resumeSnapshot: unknown;
    summary?: string | null;
    previewBlocks?: unknown;
}, writeTool?: DraftReviewWriteToolLike | null): ApprovalWriteDraftPayload;
