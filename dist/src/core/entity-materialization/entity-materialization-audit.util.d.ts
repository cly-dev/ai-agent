import type { MaterializedEntity, MaterializedEntityEvidence } from './entity-materialization.types';
export declare function serializeEntitiesForAudit(entities: readonly MaterializedEntity[]): Record<string, unknown>;
export declare function serializeEntityEvidencesForAudit(bundles: readonly MaterializedEntityEvidence[]): Record<string, unknown>;
