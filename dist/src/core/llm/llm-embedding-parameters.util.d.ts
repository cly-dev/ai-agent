import type { LlmModelConfig } from '../../../generated/prisma/client';
export type EmbeddingRuntimeParameters = {
    allowRemoteModels: boolean;
    localModelPath?: string;
};
export declare function readEmbeddingRuntimeParameters(config: Pick<LlmModelConfig, 'parameters'> | null | undefined): EmbeddingRuntimeParameters;
