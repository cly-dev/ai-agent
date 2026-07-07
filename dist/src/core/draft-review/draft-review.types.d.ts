export declare const DRAFT_REVIEW_ACTIONS: readonly ["confirm", "confirm_with_edits", "retry", "cancel"];
export type DraftReviewAction = (typeof DRAFT_REVIEW_ACTIONS)[number];
export type DraftReviewDecision = {
    action: DraftReviewAction;
    editedPreviewSerialized?: string | null;
    editedPendingWriteArguments?: Record<string, unknown> | null;
    retryInstruction?: string | null;
};
export type DraftReviewPendingWriteLike = {
    name: string;
    arguments: Record<string, unknown>;
    riskLevel?: string;
};
export type DraftReviewToolCallLike = {
    name: string;
    arguments: Record<string, unknown>;
    riskLevel?: string;
    reason?: string;
};
export type DraftReviewWriteToolLike = {
    name: string;
    inputSchema?: unknown;
    schema?: unknown;
    agentMetadata?: unknown;
};
