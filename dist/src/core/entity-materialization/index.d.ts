export type { EntityEvidenceItem, EntityEvidenceType, EntityExecutionContext, EntityMaterializationSource, EntityType, MaterializedEntity, MaterializedEntityAssets, MaterializedEntityContent, MaterializedEntityEvidence, } from './entity-materialization.types';
export { buildEntityFingerprint } from './entity-fingerprint.util';
export { serializeEntitiesForAudit, serializeEntityEvidencesForAudit, } from './entity-materialization-audit.util';
export { buildAgentEntityMaterializationStep, recordPageActionEntityMaterialization, } from './record-entity-materialization.util';
export { patchUpstreamEntitiesAfterFetchRound } from './patch-upstream-from-fetch-round.util';
export { collectImageUrlsFromMaterializedEntities, materializeEntitiesFromRuntimeContext, materializeEntitiesFromToolOutput, mergeMaterializedEntities, resolveImageUrlsForVision, } from './entity-materializer.util';
