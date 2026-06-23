import { Logger } from '@nestjs/common';

export type RuntimeCacheLayer = 'L0' | 'L1' | 'L2' | 'L3';

export type RuntimeCacheLogInput = {
  layer: RuntimeCacheLayer;
  operation: string;
  cacheHit: boolean;
  revisionMismatch?: boolean;
  sessionId?: string;
  agentId?: number;
  appClientId?: number;
  runId?: number;
  extra?: Record<string, unknown>;
};

const logger = new Logger('RuntimeCache');

export function logRuntimeCacheEvent(input: RuntimeCacheLogInput): void {
  const {
    layer,
    operation,
    cacheHit,
    revisionMismatch,
    sessionId,
    agentId,
    appClientId,
    runId,
    extra,
  } = input;
  logger.debug(
    JSON.stringify({
      cacheLayer: layer,
      operation,
      cacheHit,
      ...(revisionMismatch != null ? { revisionMismatch } : {}),
      ...(sessionId != null ? { sessionId } : {}),
      ...(agentId != null ? { agentId } : {}),
      ...(appClientId != null ? { appClientId } : {}),
      ...(runId != null ? { runId } : {}),
      ...extra,
    }),
  );
}
