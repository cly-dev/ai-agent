import type { DraftReviewWriteToolLike } from './draft-review.types';
import type { WriteDraftEditPolicy } from './write-draft.types';
export declare function resolveWriteDraftEditPolicy(input: {
    writeTool: DraftReviewWriteToolLike;
    arguments: Record<string, unknown>;
}): WriteDraftEditPolicy;
export declare function resolveWriteDraftEditPolicyForToolCall(input: {
    writeTool: DraftReviewWriteToolLike | null | undefined;
    arguments: Record<string, unknown>;
}): WriteDraftEditPolicy | null;
