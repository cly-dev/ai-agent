export declare const DEFAULT_PATH_EXCLUDE_KEYWORDS: readonly ["public", "buyer"];
export type PathFilterConfig = {
    include: string[];
    exclude: string[];
};
export declare function normalizeToolPath(path: string): string;
export declare function matchesPathFilter(path: string, filter: PathFilterConfig): boolean;
export declare function buildPathFilter(options: {
    include: Iterable<string>;
    exclude: Iterable<string>;
    useDefaultExclude?: boolean;
}): PathFilterConfig;
export declare function isExcludedToolPath(path: string): boolean;
