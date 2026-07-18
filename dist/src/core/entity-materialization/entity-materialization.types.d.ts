export type EntityMaterializationSource = 'page_context' | 'action_context' | 'upstream';
export type EntityType = string;
export type MaterializedEntityContent = {
    text?: string;
    fields?: Record<string, unknown>;
};
export type MaterializedEntityAssets = {
    imageUrls?: string[];
};
export type MaterializedEntity = {
    entityKey: string;
    fingerprint: string;
    entityType: EntityType;
    source: EntityMaterializationSource;
    path: string;
    content: MaterializedEntityContent;
    assets: MaterializedEntityAssets;
    metadata?: Record<string, unknown>;
};
export type EntityEvidenceType = 'image' | 'text' | 'classification' | 'rag' | 'other';
export type EntityEvidenceItem = {
    type: EntityEvidenceType;
    source: string;
    summary?: string;
    urls?: string[];
    legible?: boolean;
    raw?: unknown;
    createdAt?: string;
};
export type MaterializedEntityEvidence = {
    entityKey: string;
    evidence: EntityEvidenceItem[];
};
export type EntityExecutionContext = {
    entity: MaterializedEntity;
    evidence: EntityEvidenceItem[];
};
