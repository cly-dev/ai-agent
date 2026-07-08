export declare function enumerateCompactParamPathAliasCandidates(path: string): string[];
export declare function resolveArrayItemParamPathAlias(path: string, paramPaths: ReadonlySet<string>): string;
export declare function suggestArrayItemParamPathAlias(path: string, paramPaths: ReadonlySet<string>): string | null;
export declare function normalizeParamPathListAliases(paths: string[], paramPaths: ReadonlySet<string>): string[];
