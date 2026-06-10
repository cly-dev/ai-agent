/**
 * Shared pagination param detection + env-driven defaults for LIST tools.
 */

export const LEGACY_DEFAULT_ARRAY_LIMIT = 5;

/** query 参数名 → page（不区分大小写，全名匹配）。 */
export const PAGE_PARAM_RE = /^page(?:number|num|no|index)?$/i;

/** query 参数名 → page size / limit（不区分大小写，全名匹配）。 */
export const SIZE_PARAM_RE =
  /^(?:page)?size$|^limit$|^pagesize$|^per_?page$|^page_size$|^maxresults$/i;

export function classifyPaginationParam(name: string): 'page' | 'size' | null {
  if (PAGE_PARAM_RE.test(name)) {
    return 'page';
  }
  if (SIZE_PARAM_RE.test(name)) {
    return 'size';
  }
  return null;
}

export function isPaginationParam(name: string): boolean {
  return classifyPaginationParam(name) != null;
}

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

export function resolveDefaultListPage(): number {
  return readPositiveIntEnv('TOOL_LIST_DEFAULT_PAGE', 1);
}

export function resolveDefaultListSize(): number {
  return readPositiveIntEnv('TOOL_LIST_DEFAULT_SIZE', 100);
}

/** Max rows kept in projected tool output / observations (aligns with default fetch size). */
export function resolveDefaultListArrayLimit(): number {
  return readPositiveIntEnv('TOOL_LIST_ARRAY_LIMIT', resolveDefaultListSize());
}

/**
 * Treat legacy inferred arrayLimits (≤5) as env default so existing tools
 * are not stuck at 5 rows after raising the global default.
 */
export function resolveEffectiveArrayLimit(explicit: number | undefined): number {
  const envDefault = resolveDefaultListArrayLimit();
  if (explicit == null) {
    return envDefault;
  }
  if (explicit <= LEGACY_DEFAULT_ARRAY_LIMIT) {
    return envDefault;
  }
  return explicit;
}
