export declare class UpdateLlmModelConfigDto {
    provider?: string;
    model?: string;
    apiKey?: string | null;
    baseUrl?: string;
    chatPath?: string;
    parameters?: Record<string, unknown>;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
}
