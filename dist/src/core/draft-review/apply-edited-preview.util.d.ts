import type { DraftReviewDecision } from './draft-review.types';
export declare function resolveConfirmedPreviewSerialized(input: {
    decision: DraftReviewDecision;
    gatePreviewSerialized: string | null | undefined;
}): string | null;
