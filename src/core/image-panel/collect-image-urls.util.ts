/**
 * 协议级图片实体分组：按「数组元素 / 根对象」把图绑回所属实体，
 * 不写死 review / comment 等业务键名。
 *
 * 规则：
 * 1. 优先把 URL 归到含图的「对象数组元素」（更深的数组优先认领）；
 * 2. 同元素上的可读字符串 → contextText（供 VL / 下游与文对齐）；
 * 3. 未被数组元素认领的图 → 归入 root 组（详情单实体场景）。
 */

const IMAGE_EXT_RE =
  /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)(?:\?|#|$)/i;

const MIME_IMAGE_RE = /^image\//i;

/** 通用实体 id：只认协议级标量键，不认业务 kind。 */
const GENERIC_ID_KEYS = new Set([
  'id',
  'entityId',
  'entity_id',
  'uuid',
  'key',
]);

export type ImageEntityGroup = {
  /** 展示/下游对齐用：通用 id 或 path */
  entityKey: string;
  /** JSON 路径，如 items[2] */
  path: string;
  /** 同实体可读正文（截断）；详情/列表项的「文字侧」 */
  contextText?: string;
  urls: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function siblingSuggestsImage(record: Record<string, unknown>): boolean {
  for (const key of ['mimeType', 'contentType', 'content_type', 'type']) {
    const raw = record[key];
    if (typeof raw === 'string' && MIME_IMAGE_RE.test(raw.trim())) {
      return true;
    }
  }
  return false;
}

function considerUrl(
  url: string,
  parent: Record<string, unknown> | null,
  out: Set<string>,
): void {
  const trimmed = url.trim();
  if (!looksLikeAbsoluteHttpUrl(trimmed)) {
    return;
  }
  if (IMAGE_EXT_RE.test(trimmed) || (parent != null && siblingSuggestsImage(parent))) {
    out.add(trimmed);
  }
}

function walkUrls(
  value: unknown,
  parent: Record<string, unknown> | null,
  out: Set<string>,
  depth: number,
): void {
  if (depth > 12 || value == null) {
    return;
  }
  if (typeof value === 'string') {
    considerUrl(value, parent, out);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      walkUrls(item, parent, out, depth + 1);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const nested of Object.values(value)) {
    walkUrls(nested, value, out, depth + 1);
  }
}

/** 从任意 JSON 结构收集图片 URL（去重、保序近似：Set 插入序）。 */
export function collectImageUrlsFromUnknown(value: unknown): string[] {
  const out = new Set<string>();
  walkUrls(value, null, out, 0);
  return [...out];
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

function pickEntityKey(record: Record<string, unknown>, path: string): string {
  for (const key of GENERIC_ID_KEYS) {
    const raw = record[key];
    if (typeof raw === 'string' && raw.trim()) {
      return raw.trim().slice(0, 128);
    }
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return String(raw);
    }
  }
  return path || 'root';
}

/**
 * 从对象上抽取可读上下文（跳过 URL / 过长 blob）。
 * 只取浅层 string，避免把整棵树塞进 VL。
 */
export function extractEntityContextText(
  record: Record<string, unknown>,
  maxChars = 800,
): string | undefined {
  const parts: string[] = [];
  let used = 0;
  for (const [key, raw] of Object.entries(record)) {
    if (GENERIC_ID_KEYS.has(key)) {
      continue;
    }
    if (typeof raw !== 'string') {
      continue;
    }
    const text = raw.trim();
    if (!text || looksLikeAbsoluteHttpUrl(text) || IMAGE_EXT_RE.test(text)) {
      continue;
    }
    if (text.length > 2_000) {
      continue;
    }
    const piece = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    if (used + piece.length > maxChars) {
      const room = maxChars - used;
      if (room > 40) {
        parts.push(piece.slice(0, room));
      }
      break;
    }
    parts.push(piece);
    used += piece.length + 1;
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join('\n');
}

function isArrayOfRecords(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isRecord(item))
  );
}

/**
 * 深度优先：子数组元素先认领 URL，父级只拿剩余，避免列表图被摊到 root。
 */
function visitForGroups(
  value: unknown,
  path: string,
  claimed: Set<string>,
  groups: ImageEntityGroup[],
  depth: number,
): void {
  if (depth > 12 || value == null) {
    return;
  }

  if (isArrayOfRecords(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const item = value[i]!;
      const itemPath = pathJoin(path, `[${i}]`);
      visitForGroups(item, itemPath, claimed, groups, depth + 1);
      const urls = collectImageUrlsFromUnknown(item).filter(
        (url) => !claimed.has(url),
      );
      if (urls.length === 0) {
        continue;
      }
      for (const url of urls) {
        claimed.add(url);
      }
      groups.push({
        entityKey: pickEntityKey(item, itemPath),
        path: itemPath,
        contextText: extractEntityContextText(item),
        urls,
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      visitForGroups(value[i], pathJoin(path, `[${i}]`), claimed, groups, depth + 1);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      visitForGroups(nested, pathJoin(path, key), claimed, groups, depth + 1);
    }
  }
}

/** 从任意 JSON 收「实体 → 图」组；无数组时退化为单 root 组。 */
export function collectImageEntityGroups(value: unknown): ImageEntityGroup[] {
  const claimed = new Set<string>();
  const groups: ImageEntityGroup[] = [];
  visitForGroups(value, '', claimed, groups, 0);

  const orphans = collectImageUrlsFromUnknown(value).filter(
    (url) => !claimed.has(url),
  );
  if (orphans.length > 0) {
    const contextText = isRecord(value)
      ? extractEntityContextText(value)
      : undefined;
    groups.push({
      entityKey: 'root',
      path: '',
      contextText,
      urls: orphans,
    });
  }

  return groups;
}

export function collectImageEntityGroupsFromSources(input: {
  upstreamOutputs?: Record<string, unknown>;
  pageContext?: unknown;
  from: 'upstream' | 'page_context' | 'all';
}): ImageEntityGroup[] {
  const merged: ImageEntityGroup[] = [];
  const seenUrl = new Set<string>();

  const append = (source: unknown, prefix: string) => {
    for (const group of collectImageEntityGroups(source)) {
      const urls = group.urls.filter((url) => {
        if (seenUrl.has(url)) {
          return false;
        }
        seenUrl.add(url);
        return true;
      });
      if (urls.length === 0) {
        continue;
      }
      merged.push({
        ...group,
        path: group.path
          ? `${prefix}${group.path.startsWith('[') ? '' : '.'}${group.path}`
          : prefix,
        entityKey:
          group.entityKey === 'root' && prefix
            ? prefix
            : group.entityKey,
        urls,
      });
    }
  };

  if (input.from === 'upstream' || input.from === 'all') {
    append(input.upstreamOutputs ?? {}, 'upstream');
  }
  if (input.from === 'page_context' || input.from === 'all') {
    append(input.pageContext ?? null, 'page_context');
  }
  return merged;
}

/** @deprecated 兼容旧调用；新逻辑请用 collectImageEntityGroupsFromSources */
export function collectImageUrlsFromSources(input: {
  upstreamOutputs?: Record<string, unknown>;
  pageContext?: unknown;
  from: 'upstream' | 'page_context' | 'all';
}): string[] {
  return collectImageEntityGroupsFromSources(input).flatMap((row) => row.urls);
}
