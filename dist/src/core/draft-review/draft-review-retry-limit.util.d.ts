export type DraftRetryBudget = {
    used: number;
    max: number;
    remaining: number;
    canRetry: boolean;
};
export declare function resolveDraftRetryBudget(draftRetryCount: number | null | undefined): DraftRetryBudget;
export declare function canRequestDraftRetry(draftRetryCount: number | null | undefined): boolean;
export declare function resolveDraftRetryCountAfterRegeneration(input: {
    previousCount: number | null | undefined;
    regeneratedFromRetry: boolean;
}): number;
