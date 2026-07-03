import type { WriteDraftPublic } from '../../core/draft-review/write-draft.types';
export declare function extractWriteDraftPublicFromApprovalRow(row: {
    resumeSnapshot: unknown;
    summary?: string | null;
    previewBlocks?: unknown;
}): WriteDraftPublic;
