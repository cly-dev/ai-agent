import { LlmModelKind } from '../../../../generated/prisma/client';
export declare class UpsertLlmModelConfigDto {
    kind: LlmModelKind;
    provider?: string;
    model: string;
    apiKey?: string | null;
    baseUrl: string;
    chatPath?: string;
    parameters?: Record<string, unknown>;
    stream?: boolean;
    maxTokens?: number | null;
    temperature?: number | null;
    enabled?: boolean;
}
