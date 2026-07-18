import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import {
  readInlineRecordsFromPageContext,
} from '../host-bridge/page-context-metadata-scan.util';
import {
  collectImageUrlsFromSources,
  collectImageUrlsFromUnknown,
  extractEntityContextText,
} from '../image-panel/collect-image-urls.util';
import type { ToolResponseProfile } from '../tool-engine/tool-response-profile.types';
import { buildEntityFingerprint } from './entity-fingerprint.util';
import type {
  EntityMaterializationSource,
  MaterializedEntity,
} from './entity-materialization.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pathJoin(base: string, segment: string): string {
  if (!base) {
    return segment;
  }
  if (segment.startsWith('[')) {
    return `${base}${segment}`;
  }
  return `${base}.${segment}`;
}

function getByPath(root: unknown, path: string): unknown {
  if (!path.trim()) {
    return root;
  }
  let current: unknown = root;
  for (const segment of path.split('.').filter(Boolean)) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function extractTextFromRecord(record: Record<string, unknown>): string | undefined {
  const content = pickString(record.content);
  if (content) {
    return content.slice(0, 4_000);
  }
  return extractEntityContextText(record, 1_200);
}

function recordQualifiesAsEntity(record: Record<string, unknown>): boolean {
  const text = extractTextFromRecord(record);
  const imageUrls = collectImageUrlsFromUnknown(record);
  return (text != null && text.length > 0) || imageUrls.length > 0;
}

function buildFieldsProjection(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (key === 'content') {
      continue;
    }
    if (typeof value === 'string' && value.length <= 800) {
      out[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.length <= 12 &&
      value.every((row) => typeof row === 'string' || typeof row === 'number')
    ) {
      out[key] = value;
    }
  }
  return out;
}

class EntityKeyAllocator {
  private next = 0;

  private readonly usedFingerprints = new Set<string>();

  allocate(fingerprint: string): { entityKey: string; fingerprint: string } {
    let fp = fingerprint;
    let suffix = 2;
    while (this.usedFingerprints.has(fp)) {
      fp = `${fingerprint}_${suffix}`;
      suffix += 1;
    }
    this.usedFingerprints.add(fp);
    this.next += 1;
    return {
      entityKey: `ent_${String(this.next).padStart(3, '0')}`,
      fingerprint: fp,
    };
  }
}

type PushEntityInput = {
  source: EntityMaterializationSource;
  path: string;
  entityType: string;
  record: Record<string, unknown>;
};

function pushEntity(
  allocator: EntityKeyAllocator,
  seen: Set<string>,
  out: MaterializedEntity[],
  input: PushEntityInput,
): void {
  const slot = `${input.source}:${input.path}`;
  if (seen.has(slot)) {
    return;
  }
  if (!recordQualifiesAsEntity(input.record)) {
    return;
  }
  seen.add(slot);
  const fingerprint = buildEntityFingerprint({
    source: input.source,
    path: input.path,
  });
  const ids = allocator.allocate(fingerprint);
  const text = extractTextFromRecord(input.record);
  const imageUrls = collectImageUrlsFromUnknown(input.record);
  out.push({
    entityKey: ids.entityKey,
    fingerprint: ids.fingerprint,
    entityType: input.entityType,
    source: input.source,
    path: input.path,
    content: {
      ...(text ? { text } : {}),
      fields: buildFieldsProjection(input.record),
    },
    assets: imageUrls.length > 0 ? { imageUrls } : {},
  });
}

function isArrayOfRecords(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((row) => isRecord(row))
  );
}

function visitStructural(
  value: unknown,
  path: string,
  source: EntityMaterializationSource,
  entityTypeHint: string,
  allocator: EntityKeyAllocator,
  seen: Set<string>,
  out: MaterializedEntity[],
  depth: number,
): void {
  if (depth > 12 || value == null) {
    return;
  }

  if (isArrayOfRecords(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const item = value[i]!;
      const itemPath = pathJoin(path, `[${i}]`);
      pushEntity(allocator, seen, out, {
        source,
        path: itemPath,
        entityType: entityTypeHint,
        record: item,
      });
      visitStructural(
        item,
        itemPath,
        source,
        entityTypeHint,
        allocator,
        seen,
        out,
        depth + 1,
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      visitStructural(
        value[i],
        pathJoin(path, `[${i}]`),
        source,
        entityTypeHint,
        allocator,
        seen,
        out,
        depth + 1,
      );
    }
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (path) {
    pushEntity(allocator, seen, out, {
      source,
      path,
      entityType: entityTypeHint,
      record: value,
    });
  }

  for (const [key, nested] of Object.entries(value)) {
    if (key === 'metadata' && source === 'page_context' && path === '') {
      continue;
    }
    visitStructural(
      nested,
      pathJoin(path, key),
      source,
      entityTypeHint,
      allocator,
      seen,
      out,
      depth + 1,
    );
  }
}

/**
 * 从 pageContext + actionContext 物化实体。
 * entityKey 由服务端生成；不读业务 id 作主键。
 */
export function materializeEntitiesFromRuntimeContext(input: {
  pageContext?: AgentChatPageContext | null;
  actionContext?: Record<string, unknown> | null;
}): MaterializedEntity[] {
  const allocator = new EntityKeyAllocator();
  const seen = new Set<string>();
  const out: MaterializedEntity[] = [];
  const pageEntityType = pickString(input.pageContext?.entity?.type) ?? 'entity';

  if (input.pageContext) {
    for (const row of readInlineRecordsFromPageContext(input.pageContext)) {
      pushEntity(allocator, seen, out, {
        source: 'page_context',
        path: `metadata.${row.kind}`,
        entityType: pageEntityType !== 'entity' ? pageEntityType : row.kind,
        record: row.record,
      });
    }
    visitStructural(
      input.pageContext,
      '',
      'page_context',
      pageEntityType,
      allocator,
      seen,
      out,
      0,
    );
  }

  if (input.actionContext && Object.keys(input.actionContext).length > 0) {
    pushEntity(allocator, seen, out, {
      source: 'action_context',
      path: '',
      entityType: pageEntityType,
      record: input.actionContext,
    });
    visitStructural(
      input.actionContext,
      '',
      'action_context',
      pageEntityType,
      allocator,
      seen,
      out,
      0,
    );
  }

  return out;
}

/** 从 Tool 列表/详情响应追加物化实体（upstream）。 */
export function materializeEntitiesFromToolOutput(input: {
  raw: unknown;
  profile: ToolResponseProfile | null;
}): MaterializedEntity[] {
  if (input.raw == null) {
    return [];
  }
  const allocator = new EntityKeyAllocator();
  const seen = new Set<string>();
  const out: MaterializedEntity[] = [];
  const entityType = pickString(input.profile?.entityType) ?? 'entity';

  if (input.profile?.listPath) {
    const listValue = getByPath(input.raw, input.profile.listPath);
    if (!Array.isArray(listValue)) {
      return [];
    }
    const listPath = input.profile.listPath;
    for (let i = 0; i < listValue.length; i += 1) {
      const row = listValue[i];
      if (!isRecord(row)) {
        continue;
      }
      pushEntity(allocator, seen, out, {
        source: 'upstream',
        path: `${listPath}[${i}]`,
        entityType,
        record: row,
      });
    }
    return out;
  }

  if (isRecord(input.raw)) {
    pushEntity(allocator, seen, out, {
      source: 'upstream',
      path: '',
      entityType,
      record: input.raw,
    });
  }
  return out;
}

export function mergeMaterializedEntities(
  existing: readonly MaterializedEntity[],
  incoming: readonly MaterializedEntity[],
): MaterializedEntity[] {
  const seen = new Set(existing.map((row) => `${row.source}:${row.path}`));
  const merged = [...existing];
  for (const row of incoming) {
    const slot = `${row.source}:${row.path}`;
    if (seen.has(slot)) {
      continue;
    }
    seen.add(slot);
    merged.push(row);
  }
  return merged;
}

export function collectImageUrlsFromMaterializedEntities(
  entities: readonly MaterializedEntity[],
  sources: readonly EntityMaterializationSource[],
): string[] {
  const sourceSet = new Set(sources);
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const entity of entities) {
    if (!sourceSet.has(entity.source)) {
      continue;
    }
    for (const url of entity.assets.imageUrls ?? []) {
      if (seen.has(url)) {
        continue;
      }
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function sourcesForVisionFrom(
  from: 'page_context' | 'upstream' | 'all',
): EntityMaterializationSource[] {
  if (from === 'upstream') {
    return ['upstream'];
  }
  if (from === 'page_context') {
    // actionContext 与 page 同级运行时输入，识图 page_context 时应一并纳入。
    return ['page_context', 'action_context'];
  }
  return ['page_context', 'action_context', 'upstream'];
}

export function resolveImageUrlsForVision(input: {
  from: 'page_context' | 'upstream' | 'all';
  entities?: readonly MaterializedEntity[];
  pageContext?: unknown;
  upstreamOutputs?: Record<string, unknown>;
}): string[] {
  if (input.entities && input.entities.length > 0) {
    const urls = collectImageUrlsFromMaterializedEntities(
      input.entities,
      sourcesForVisionFrom(input.from),
    );
    if (urls.length > 0) {
      return urls;
    }
  }

  return collectImageUrlsFromSources({
    from: input.from,
    pageContext: input.pageContext,
    upstreamOutputs: input.upstreamOutputs,
  });
}
