export type ApprovalEntityReferenceSource = {
    ref: string;
    action: string;
    toolName: string | null;
    toolId: number | null;
    data: unknown;
};
export type ApprovalEntityReference = {
    page: string | null;
    routePath: string | null;
    entityType: string | null;
    entityId: string | null;
    inlineRecords: Array<{
        kind: string;
        record: Record<string, unknown>;
    }>;
    sources: ApprovalEntityReferenceSource[];
};
export declare function buildApprovalEntityReferenceFromSnapshot(snapshotInput: unknown): ApprovalEntityReference;
