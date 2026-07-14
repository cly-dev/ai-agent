/**
 * PageAction HostTool args ↔ invoke context 类目 id 白名单协议。
 *
 * argsSchema 属性可标注：
 *   "x-contextIdCatalog": "categories"
 * 表示该 string[] 的元素必须 ⊆ context.categories[].id（点分路径，取数组元素的 id 字段）。
 *
 * 不做业务字段名硬编码；无标注则不约束。产参时 enrich enum + 落盘前 sanitize 双保险。
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const CONTEXT_ID_CATALOG_KEY = 'x-contextIdCatalog';

/** 从 context 点分路径读取 `{ id }[]`，收集 id 集合（string 化）。 */
export function collectContextIdCatalog(
  context: Record<string, unknown> | null | undefined,
  catalogPath: string,
): Set<string> {
  const out = new Set<string>();
  if (!context || !catalogPath.trim()) {
    return out;
  }
  const parts = catalogPath.split('.').map((part) => part.trim()).filter(Boolean);
  let cursor: unknown = context;
  for (const part of parts) {
    if (!isRecord(cursor)) {
      return out;
    }
    cursor = cursor[part];
  }
  if (!Array.isArray(cursor)) {
    return out;
  }
  for (const item of cursor) {
    if (!isRecord(item)) {
      continue;
    }
    const id = item.id;
    if (typeof id === 'string' && id.trim()) {
      out.add(id.trim());
    } else if (typeof id === 'number' && Number.isFinite(id)) {
      out.add(String(id));
    }
  }
  return out;
}

function readPropertyCatalogPath(def: unknown): string | null {
  if (!isRecord(def)) {
    return null;
  }
  const raw = def[CONTEXT_ID_CATALOG_KEY];
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  // 也允许写在 items 上
  if (isRecord(def.items)) {
    const nested = def.items[CONTEXT_ID_CATALOG_KEY];
    if (typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }
  return null;
}

/**
 * 将 context 类目 id 注入 argsSchema 对应 array.items.enum，
 * 缩小 tool_call 合法取值（与 sanitize 互补）。
 */
export function enrichHostToolArgsSchemaWithContextCatalogs(
  argsSchema: Record<string, unknown>,
  context: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!context || !isRecord(argsSchema.properties)) {
    return argsSchema;
  }
  const properties = argsSchema.properties as Record<string, unknown>;
  let changed = false;
  const nextProperties: Record<string, unknown> = { ...properties };

  for (const [key, def] of Object.entries(properties)) {
    const catalogPath = readPropertyCatalogPath(def);
    if (!catalogPath || !isRecord(def)) {
      continue;
    }
    const allowed = [...collectContextIdCatalog(context, catalogPath)];
    if (allowed.length === 0) {
      continue;
    }
    const items = isRecord(def.items) ? { ...def.items } : { type: 'string' };
    nextProperties[key] = {
      ...def,
      items: {
        ...items,
        type: 'string',
        enum: allowed,
      },
    };
    changed = true;
  }

  if (!changed) {
    return argsSchema;
  }
  return {
    ...argsSchema,
    properties: nextProperties,
  };
}

export type SanitizeHostToolArgsCatalogResult = {
  args: Record<string, unknown>;
  /** 被踢掉的非法 id，按字段 */
  droppedByField: Record<string, string[]>;
};

/**
 * 落盘 / flush 前：按 x-contextIdCatalog 剔除不在白名单的 id。
 * customTagNames 等无标注字段不受影响。
 */
export function sanitizeHostToolArgsAgainstContextCatalogs(
  args: Record<string, unknown>,
  argsSchema: Record<string, unknown>,
  context: Record<string, unknown> | null | undefined,
): SanitizeHostToolArgsCatalogResult {
  if (!context || !isRecord(argsSchema.properties)) {
    return { args, droppedByField: {} };
  }
  const properties = argsSchema.properties as Record<string, unknown>;
  const next: Record<string, unknown> = { ...args };
  const droppedByField: Record<string, string[]> = {};

  for (const [key, def] of Object.entries(properties)) {
    const catalogPath = readPropertyCatalogPath(def);
    if (!catalogPath) {
      continue;
    }
    const value = next[key];
    if (!Array.isArray(value)) {
      continue;
    }
    const allowed = collectContextIdCatalog(context, catalogPath);
    if (allowed.size === 0) {
      // context 未带目录时不误杀
      continue;
    }
    const kept: string[] = [];
    const dropped: string[] = [];
    for (const item of value) {
      const id =
        typeof item === 'string'
          ? item.trim()
          : typeof item === 'number' && Number.isFinite(item)
            ? String(item)
            : '';
      if (!id) {
        continue;
      }
      if (allowed.has(id)) {
        kept.push(id);
      } else {
        dropped.push(id);
      }
    }
    next[key] = kept;
    if (dropped.length > 0) {
      droppedByField[key] = dropped;
    }
  }

  return { args: next, droppedByField };
}
