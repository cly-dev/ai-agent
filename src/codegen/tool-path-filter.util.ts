/** 默认不作为 agent Tool 的 path 关键字（可用 --no-default-path-exclude 关闭） */
export const DEFAULT_PATH_EXCLUDE_KEYWORDS = ['public', 'buyer'] as const;

export type PathFilterConfig = {
  /** 非空时：path 须至少匹配一项（子串，不区分大小写） */
  include: string[];
  /** path 不得匹配任一项（子串，不区分大小写） */
  exclude: string[];
};

export function normalizeToolPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return '/';
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function pathMatchesPattern(path: string, pattern: string): boolean {
  const normalizedPath = normalizeToolPath(path).toLowerCase();
  const raw = pattern.trim();
  if (!raw) {
    return false;
  }
  return normalizedPath.includes(raw.toLowerCase());
}

export function matchesPathFilter(path: string, filter: PathFilterConfig): boolean {
  if (filter.include.length > 0) {
    const included = filter.include.some((pattern) =>
      pathMatchesPattern(path, pattern),
    );
    if (!included) {
      return false;
    }
  }
  return !filter.exclude.some((pattern) => pathMatchesPattern(path, pattern));
}

export function buildPathFilter(options: {
  include: Iterable<string>;
  exclude: Iterable<string>;
  useDefaultExclude?: boolean;
}): PathFilterConfig {
  const exclude = new Set(
    [...options.exclude].map((item) => item.trim()).filter(Boolean),
  );
  if (options.useDefaultExclude !== false) {
    for (const keyword of DEFAULT_PATH_EXCLUDE_KEYWORDS) {
      exclude.add(keyword);
    }
  }
  return {
    include: [...options.include].map((item) => item.trim()).filter(Boolean),
    exclude: [...exclude],
  };
}

/** @deprecated 使用 matchesPathFilter + buildPathFilter */
export function isExcludedToolPath(path: string): boolean {
  const filter = buildPathFilter({ include: [], exclude: [] });
  return !matchesPathFilter(path, filter);
}
