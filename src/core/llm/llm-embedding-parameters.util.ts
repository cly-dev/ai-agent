import type { LlmModelConfig } from '../../../generated/prisma/client';

export type EmbeddingRuntimeParameters = {
  allowRemoteModels: boolean;
  localModelPath?: string;
};

export function readEmbeddingRuntimeParameters(
  config: Pick<LlmModelConfig, 'parameters'> | null | undefined,
): EmbeddingRuntimeParameters {
  const params = normalizeJsonObject(config?.parameters);
  const allowRemote =
    params.allowRemoteModels === true ||
    process.env.AGENT_EMBEDDING_LOCAL_ALLOW_REMOTE?.trim() === 'true';
  const fromDb =
    typeof params.localModelPath === 'string'
      ? params.localModelPath.trim()
      : '';
  const localModelPath =
    fromDb ||
    process.env.AGENT_EMBEDDING_LOCAL_MODEL_PATH?.trim() ||
    undefined;
  return {
    allowRemoteModels: allowRemote,
    localModelPath,
  };
}

function normalizeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}
