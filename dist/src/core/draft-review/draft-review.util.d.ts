import { type DraftReviewAction, type DraftReviewDecision } from './draft-review.types';
export declare function isDraftReviewAction(value: unknown): value is DraftReviewAction;
export declare function normalizeDraftReviewDecision(input: DraftReviewDecision | null | undefined): DraftReviewDecision | null;
export declare function draftReviewDecisionFromLegacyFlags(input: {
    confirmWrite?: boolean;
    cancelWrite?: boolean;
}): DraftReviewDecision | null;
export declare function buildRetryUserMessage(input: {
    baseUserMessage: string;
    retryInstruction: string;
}): string;
