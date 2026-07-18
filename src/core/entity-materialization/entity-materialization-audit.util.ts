import type {
  EntityEvidenceItem,
  MaterializedEntity,
  MaterializedEntityEvidence,
} from './entity-materialization.types';

const MAX_TEXT_AUDIT = 400;
const MAX_FIELD_COUNT = 24;

function truncate(value: string, max = MAX_TEXT_AUDIT): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
}

/** 写入 PageAction / AgentRun 步骤的精简实体快照（可全量回看结构）。 */
export function serializeEntitiesForAudit(
  entities: readonly MaterializedEntity[],
): Record<string, unknown> {
  return {
    count: entities.length,
    entities: entities.map((row) => ({
      entityKey: row.entityKey,
      fingerprint: row.fingerprint,
      entityType: row.entityType,
      source: row.source,
      path: row.path,
      content: {
        text: row.content.text ? truncate(row.content.text) : undefined,
        fieldKeys: Object.keys(row.content.fields ?? {}).slice(0, MAX_FIELD_COUNT),
        fields: row.content.fields,
      },
      imageUrlCount: row.assets.imageUrls?.length ?? 0,
      imageUrls: row.assets.imageUrls,
    })),
  };
}

export function serializeEntityEvidencesForAudit(
  bundles: readonly MaterializedEntityEvidence[],
): Record<string, unknown> {
  return {
    count: bundles.length,
    bundles: bundles.map((row) => ({
      entityKey: row.entityKey,
      evidence: row.evidence.map((item) => summarizeEvidenceItem(item)),
    })),
  };
}

function summarizeEvidenceItem(item: EntityEvidenceItem): Record<string, unknown> {
  return {
    type: item.type,
    source: item.source,
    summary: item.summary ? truncate(item.summary) : undefined,
    urlCount: item.urls?.length ?? 0,
    legible: item.legible,
  };
}
