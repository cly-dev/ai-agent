export type ImageEntityGroup = {
    entityKey: string;
    path: string;
    contextText?: string;
    urls: string[];
};
export declare function collectImageUrlsFromUnknown(value: unknown): string[];
export declare function extractEntityContextText(record: Record<string, unknown>, maxChars?: number): string | undefined;
export declare function collectImageEntityGroups(value: unknown): ImageEntityGroup[];
export declare function collectImageEntityGroupsFromSources(input: {
    upstreamOutputs?: Record<string, unknown>;
    pageContext?: unknown;
    from: 'upstream' | 'page_context' | 'all';
}): ImageEntityGroup[];
export declare function collectImageUrlsFromSources(input: {
    upstreamOutputs?: Record<string, unknown>;
    pageContext?: unknown;
    from: 'upstream' | 'page_context' | 'all';
}): string[];
