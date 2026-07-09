export declare function cosineSimilarity(a: number[], b: number[]): number;
export declare function buildCategoryEmbedText(row: {
    label: string;
    description: string | null;
}): string;
export declare function buildToolEmbedText(row: {
    name: string;
    description: string;
}): string;
export declare function keywordToolRecallScore(query: string, tool: {
    name: string;
    description: string;
    agentMetadata?: unknown;
}): number;
export declare function keywordRecallScore(query: string, category: {
    label: string;
    description: string | null;
}): number;
export declare function tokenizeKeywordQuery(query: string): string[];
