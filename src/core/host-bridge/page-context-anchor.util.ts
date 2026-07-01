import type { AgentChatPageContext } from './page-context.types';
import { assessPageContextData } from './page-context-usage.util';

export type PageContextAnchor = {
  page: string | null;
  routePath: string | null;
  entityId: string | null;
  entityType: string | null;
};

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** 页锚点：host tool scope 对齐所需的最小 pageContext 形态。 */
export function assessPageContextAnchor(
  pageContext: AgentChatPageContext | null | undefined,
): PageContextAnchor {
  if (!pageContext) {
    return {
      page: null,
      routePath: null,
      entityId: null,
      entityType: null,
    };
  }
  const assessment = assessPageContextData(pageContext);
  return {
    page: assessment.page,
    routePath: pickString(pageContext.routePath),
    entityId: assessment.entityId,
    entityType: assessment.entityType,
  };
}

/**
 * Host Tool 页面过滤 scope：优先 page，其次非根 routePath。
 * entity-only 时返回 null（仅匹配 hostPageScope 未绑定的 tool）。
 */
export function resolveHostToolPageScope(
  pageContext: AgentChatPageContext | null | undefined,
): string | null {
  const anchor = assessPageContextAnchor(pageContext);
  if (anchor.page) {
    return anchor.page;
  }
  if (anchor.routePath && anchor.routePath !== '/') {
    return anchor.routePath;
  }
  return null;
}

/**
 * L2：是否允许向宿主推 host_action SSE。
 * 需要 page anchor，或待派发 tool 均为无 hostPageScope 绑定的通用 tool。
 */
export function canDispatchHostAction(input: {
  pageContext: AgentChatPageContext | null | undefined;
  hostPageScopes: Array<string | null | undefined>;
}): boolean {
  if (resolveHostToolPageScope(input.pageContext) != null) {
    return true;
  }
  if (input.hostPageScopes.length === 0) {
    return false;
  }
  return input.hostPageScopes.every(
    (scope) => scope == null || String(scope).trim() === '',
  );
}
