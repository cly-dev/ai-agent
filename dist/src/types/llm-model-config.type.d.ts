export interface LlmModelConfigType {
    id?: number;
    singletonKey?: number;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: unknown | null;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
