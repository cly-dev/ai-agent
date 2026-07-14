export declare const LEGACY_DEFAULT_ARRAY_LIMIT = 5;
export declare const PAGE_PARAM_RE: RegExp;
export declare const SIZE_PARAM_RE: RegExp;
export declare function classifyPaginationParam(name: string): 'page' | 'size' | null;
export declare function isPaginationParam(name: string): boolean;
export declare function resolveDefaultListPage(): number;
export declare function resolveDefaultListSize(): number;
export declare function resolveDefaultListArrayLimit(): number;
export declare function resolveEffectiveArrayLimit(explicit: number | undefined): number;
