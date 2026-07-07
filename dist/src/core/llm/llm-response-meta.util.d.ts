export declare function extractLlmTokenUsageFromResponseMeta(responseMeta?: Record<string, unknown>): {
    promptTokens: number;
    completionTokens: number;
} | null;
export declare function resolveLlmModelNameFromResponseMeta(responseMeta?: Record<string, unknown>): string | null;
