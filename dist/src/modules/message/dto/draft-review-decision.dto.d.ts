import { DRAFT_REVIEW_ACTIONS } from '../../../core/draft-review';
export declare class DraftReviewDecisionDto {
    action: (typeof DRAFT_REVIEW_ACTIONS)[number];
    editedPreviewSerialized?: string | null;
    editedPendingWriteArguments?: Record<string, unknown> | null;
    retryInstruction?: string | null;
}
