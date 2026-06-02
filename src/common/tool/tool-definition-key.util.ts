import { HttpMethod } from '../../../generated/prisma/client';

const DEFINITION_KEY_MAX_LEN = 128;
const DEFINITION_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/** 将片段转为 definitionKey 可用段（小写、数字、点、下划线、连字符）。 */
export function slugDefinitionKeySegment(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'misc';
}

/** OpenAPI path → key 段，如 `/api/orders/{id}` → `api.orders.id` */
export function slugDefinitionKeyPath(urlPath: string): string {
  const normalized = urlPath.trim().replace(/^\/+/, '');
  if (!normalized) {
    return 'root';
  }
  return normalized
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/^\{+|\}+$/g, ''))
    .map((segment) => slugDefinitionKeySegment(segment))
    .join('.');
}

export function normalizeDefinitionKey(raw: string): string {
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '');
  if (!key || !DEFINITION_KEY_PATTERN.test(key)) {
    throw new Error(
      'definitionKey must match [a-z0-9][a-z0-9._-]* (max 128 chars)',
    );
  }
  if (key.length > DEFINITION_KEY_MAX_LEN) {
    return key.slice(0, DEFINITION_KEY_MAX_LEN).replace(/[._-]+$/g, '');
  }
  return key;
}

/** 历史数据或未手填时的占位 key（按主键唯一，便于后续人工合并）。 */
export function legacyToolDefinitionKey(toolId: number): string {
  return `legacy_${toolId}`;
}

export type BuildToolDefinitionKeyInput = {
  method: HttpMethod | string;
  path: string;
  /** OpenAPI tag / 类目 label */
  categoryLabel?: string | null;
  /** LLM tool 名或 operationId */
  name?: string | null;
  operationId?: string | null;
};

/**
 * 生成跨 App 可对齐的业务 key（同一 appClientId 下唯一）。
 * 优先：{tag}.{operationId}；否则 {tag}.{method}.{pathSlug}
 */
export function buildToolDefinitionKey(input: BuildToolDefinitionKeyInput): string {
  const tag = slugDefinitionKeySegment(input.categoryLabel ?? 'misc');
  const operationId = input.operationId?.trim() || input.name?.trim();
  if (operationId) {
    return normalizeDefinitionKey(`${tag}.${slugDefinitionKeySegment(operationId)}`);
  }
  const method = String(input.method).toLowerCase();
  const pathPart = slugDefinitionKeyPath(input.path);
  return normalizeDefinitionKey(`${tag}.${method}.${pathPart}`);
}

export function resolveToolDefinitionKeyForCreate(input: {
  definitionKey?: string | null;
  method: HttpMethod;
  path: string;
  name: string;
  categoryLabel?: string | null;
}): string {
  if (input.definitionKey?.trim()) {
    return normalizeDefinitionKey(input.definitionKey);
  }
  return buildToolDefinitionKey({
    method: input.method,
    path: input.path,
    name: input.name,
    categoryLabel: input.categoryLabel,
  });
}
