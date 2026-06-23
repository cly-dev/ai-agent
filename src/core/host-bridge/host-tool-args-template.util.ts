import type { AgentChatPageContext } from './page-context.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPathFromPageContext(
  pageContext: AgentChatPageContext,
  path: string,
): unknown {
  const trimmed = path.trim();
  if (trimmed === 'page') {
    return pageContext.page;
  }
  if (trimmed === 'routePath') {
    return pageContext.routePath;
  }
  if (trimmed.startsWith('routeParams.')) {
    const key = trimmed.slice('routeParams.'.length);
    const params = pageContext.routeParams;
    if (!params || typeof params !== 'object') {
      return undefined;
    }
    return (params as Record<string, unknown>)[key];
  }
  if (trimmed === 'flowId') {
    return pageContext.flowId;
  }
  if (trimmed === 'programName') {
    return pageContext.programName;
  }
  if (trimmed.startsWith('entity.')) {
    const key = trimmed.slice('entity.'.length);
    const entity = pageContext.entity;
    if (!entity || typeof entity !== 'object') {
      return undefined;
    }
    return (entity as Record<string, unknown>)[key];
  }
  if (trimmed.startsWith('metadata.')) {
    const key = trimmed.slice('metadata.'.length);
    const metadata = pageContext.metadata;
    if (!metadata || typeof metadata !== 'object') {
      return undefined;
    }
    return metadata[key];
  }
  return undefined;
}

function resolveTemplateValue(
  value: unknown,
  pageContext: AgentChatPageContext,
): unknown {
  if (typeof value === 'string') {
    const match = /^\$([a-zA-Z][\w.]*)$/.exec(value.trim());
    if (match) {
      return readPathFromPageContext(pageContext, match[1]!);
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateValue(item, pageContext));
  }
  if (isRecord(value)) {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = resolveTemplateValue(nested, pageContext);
    }
    return next;
  }
  return value;
}

/** 将 argsTemplate 中的 `$entity.id` 等占位符解析为 pageContext 实际值。 */
export function resolveHostToolArgsTemplate(
  template: unknown,
  pageContext: AgentChatPageContext,
): Record<string, unknown> {
  if (!isRecord(template)) {
    return {};
  }
  const resolved = resolveTemplateValue(template, pageContext);
  return isRecord(resolved) ? resolved : {};
}
