import type { AgentChatPageContext } from './page-context.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeRouteParams(
  value: unknown,
): AgentChatPageContext['routeParams'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      continue;
    }
    if (
      nested === null ||
      typeof nested === 'string' ||
      typeof nested === 'number' ||
      typeof nested === 'boolean'
    ) {
      if (typeof nested === 'string') {
        const trimmed = nested.trim();
        if (trimmed) {
          out[trimmedKey] = trimmed;
        }
        continue;
      }
      if (nested !== null) {
        out[trimmedKey] = nested;
      }
      continue;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeEntity(value: unknown): AgentChatPageContext['entity'] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const entity: NonNullable<AgentChatPageContext['entity']> = { ...value };
  const type = pickString(entity.type);
  const id = pickString(entity.id);
  if (type) {
    entity.type = type;
  } else {
    delete entity.type;
  }
  if (id) {
    entity.id = id;
  } else {
    delete entity.id;
  }
  return Object.keys(entity).length > 0 ? entity : undefined;
}

function normalizePageContextObject(value: unknown): AgentChatPageContext | null {
  if (!isRecord(value)) {
    return null;
  }
  const page = pickString(value.page);
  const routePath = pickString(value.routePath);
  const routeParams = normalizeRouteParams(value.routeParams);
  const flowId = pickNumber(value.flowId);
  const programName = pickString(value.programName);
  const entity = normalizeEntity(value.entity);
  const metadata = isRecord(value.metadata) ? value.metadata : undefined;
  if (
    !page &&
    !routePath &&
    !routeParams &&
    flowId == null &&
    !programName &&
    !entity &&
    !metadata
  ) {
    return null;
  }
  return {
    ...(page ? { page } : {}),
    ...(routePath ? { routePath } : {}),
    ...(routeParams ? { routeParams } : {}),
    ...(flowId != null ? { flowId } : {}),
    ...(programName ? { programName } : {}),
    ...(entity ? { entity } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

function mergePageContexts(
  primary: AgentChatPageContext | null,
  fallback: AgentChatPageContext | null,
): AgentChatPageContext | null {
  if (!primary && !fallback) {
    return null;
  }
  const merged: AgentChatPageContext = {
    ...(fallback ?? {}),
    ...(primary ?? {}),
  };
  if (primary?.entity || fallback?.entity) {
    merged.entity = {
      ...(fallback?.entity ?? {}),
      ...(primary?.entity ?? {}),
    };
  }
  if (primary?.metadata || fallback?.metadata) {
    merged.metadata = {
      ...(fallback?.metadata ?? {}),
      ...(primary?.metadata ?? {}),
    };
  }
  if (primary?.routeParams || fallback?.routeParams) {
    merged.routeParams = {
      ...(fallback?.routeParams ?? {}),
      ...(primary?.routeParams ?? {}),
    };
  }
  if (
    !merged.page &&
    !merged.routePath &&
    !merged.routeParams &&
    merged.flowId == null &&
    !merged.programName &&
    !merged.entity &&
    !merged.metadata
  ) {
    return null;
  }
  return merged;
}

/** Merge nested `pageContext` with flat duplicate fields from the message body. */
export function parsePageContextFromMessageFields(input: {
  pageContext?: unknown;
  page?: unknown;
  routePath?: unknown;
  routeParams?: unknown;
  flowId?: unknown;
  programName?: unknown;
  entity?: unknown;
  metadata?: unknown;
}): AgentChatPageContext | null {
  const nested = normalizePageContextObject(input.pageContext);
  const flat = normalizePageContextObject({
    page: input.page,
    routePath: input.routePath,
    routeParams: input.routeParams,
    flowId: input.flowId,
    programName: input.programName,
    entity: input.entity,
    metadata: input.metadata,
  });
  return mergePageContexts(nested, flat);
}
