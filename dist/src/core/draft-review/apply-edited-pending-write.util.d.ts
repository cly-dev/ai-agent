import type { DraftReviewDecision, DraftReviewPendingWriteLike, DraftReviewToolCallLike, DraftReviewWriteToolLike } from './draft-review.types';
export declare function applyDraftReviewToPendingWrite(input: {
    pending: DraftReviewPendingWriteLike;
    decision: DraftReviewDecision;
    writeTool?: DraftReviewWriteToolLike | null;
}): DraftReviewPendingWriteLike;
export declare function applyDraftReviewToToolCalls(input: {
    toolCalls: DraftReviewToolCallLike[];
    decision: DraftReviewDecision;
    scopedTools: DraftReviewWriteToolLike[];
}): DraftReviewToolCallLike[];
export declare function assertDraftReviewToolCallsValid(input: {
    toolCalls: DraftReviewToolCallLike[];
    scopedTools: DraftReviewWriteToolLike[];
}): void;
