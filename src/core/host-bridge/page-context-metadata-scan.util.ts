import type { AgentChatPageContext } from './page-context.types';

/** pageContext 内联正文协议字段（跨租户结构约定，非业务实体名）。 */
const INLINE_BODY_FIELD = 'content';

export type PageContextInlineRecord = {
  /** metadata 顶层键名 */
  kind: string;
  record: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** page_context 物化 observation 名：`page_context:{kind}`。 */
export function buildPageContextObservationName(kind: string): string {
  const trimmed = kind.trim();
  return trimmed.length > 0 ? `page_context:${trimmed}` : 'page_context:unknown';
}

function pickFirstRouteParamId(
  routeParams: Record<string, unknown> | undefined,
): string | null {
  if (!routeParams) {
    return null;
  }
  for (const value of Object.values(routeParams)) {
    const picked = pickString(value);
    if (picked) {
      return picked;
    }
  }
  return null;
}

/** 从 pageContext 解析实体 id：entity.id → routeParams 中首个非空字符串。 */
export function resolvePageContextEntityId(
  pageContext: AgentChatPageContext | null | undefined,
): string | null {
  if (!pageContext) {
    return null;
  }
  return (
    pickString(pageContext.entity?.id) ?? pickFirstRouteParamId(pageContext.routeParams)
  );
}

/**
 * 扫描 metadata：每个含非空 `content` 字段的对象视为内联实体。
 * kind = metadata 键名；不预设 review/order 等业务类型。
 */
export function readInlineRecordsFromPageContext(
  pageContext: AgentChatPageContext,
): PageContextInlineRecord[] {
  const metadata = pageContext.metadata;
  if (!isRecord(metadata)) {
    return [];
  }
  const fallbackEntityId = resolvePageContextEntityId(pageContext);
  const records: PageContextInlineRecord[] = [];
  for (const [kind, value] of Object.entries(metadata)) {
    if (!isRecord(value)) {
      continue;
    }
    const content = pickString(value[INLINE_BODY_FIELD]);
    if (!content) {
      continue;
    }
    const entityId = fallbackEntityId ?? pickString(value.id);
    const record: Record<string, unknown> = {
      ...value,
      [INLINE_BODY_FIELD]: content,
    };
    if (entityId) {
      record.id = entityId;
    }
    records.push({ kind, record });
  }
  return records;
}
