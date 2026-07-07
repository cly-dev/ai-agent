/**
 * OpenAPI compact param path 对 array/object 嵌套使用 `[]` 标记数组元素段，例如：
 * - `items[].content`（顶层 array body）
 * - `payload.lines[].sku`（object 内嵌 array）
 * - `root.lines[].items[].qty`（多层 array）
 *
 * B 端常省略 `[]`（如 `payload.lines.sku`）；保存/校验前归一为 schema 展开形态。
 */

function splitPathSegments(path: string): string[] {
  return path.split('.').filter((segment) => segment.length > 0);
}

/** 在每一段后可选插入 `[]`，生成所有别名候选（段数 n 时最多 2^n 种）。 */
export function enumerateCompactParamPathAliasCandidates(path: string): string[] {
  const segments = splitPathSegments(path);
  if (segments.length === 0) {
    return [path];
  }
  const candidates: string[] = [];
  const variantCount = 1 << segments.length;
  for (let mask = 0; mask < variantCount; mask += 1) {
    const parts: string[] = [];
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      parts.push(mask & (1 << i) ? `${segment}[]` : segment);
    }
    candidates.push(parts.join('.'));
  }
  return candidates;
}

function countArrayMarkers(path: string): number {
  return (path.match(/\[\]/g) ?? []).length;
}

/**
 * 将 B 端点路径归一为 inputSchema 展开的 compact path。
 * 优先精确命中；否则选「插入 `[]` 最少」的匹配项（更接近用户写法）。
 */
export function resolveArrayItemParamPathAlias(
  path: string,
  paramPaths: ReadonlySet<string>,
): string {
  if (paramPaths.has(path)) {
    return path;
  }
  let best: string | null = null;
  let bestMarkerCount = Number.POSITIVE_INFINITY;
  for (const candidate of enumerateCompactParamPathAliasCandidates(path)) {
    if (candidate === path || !paramPaths.has(candidate)) {
      continue;
    }
    const markerCount = countArrayMarkers(candidate);
    if (markerCount < bestMarkerCount) {
      best = candidate;
      bestMarkerCount = markerCount;
    }
  }
  return best ?? path;
}

export function suggestArrayItemParamPathAlias(
  path: string,
  paramPaths: ReadonlySet<string>,
): string | null {
  if (paramPaths.has(path)) {
    return null;
  }
  const resolved = resolveArrayItemParamPathAlias(path, paramPaths);
  return resolved !== path ? resolved : null;
}

export function normalizeParamPathListAliases(
  paths: string[],
  paramPaths: ReadonlySet<string>,
): string[] {
  return paths.map((path) => resolveArrayItemParamPathAlias(path, paramPaths));
}
