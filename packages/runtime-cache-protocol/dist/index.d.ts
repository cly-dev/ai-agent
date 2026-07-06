export type RuntimeCatalogRevision = {
    appClientId: number;
    agentId?: number;
    toolsRevision: string;
    hostToolsRevision: string;
    workflowsRevision: string;
    promptsRevision: string;
    updatedAt: string;
};
export type RuntimeCatalogSnapshotMeta = {
    revision: RuntimeCatalogRevision;
    fetchedAt: string;
};
