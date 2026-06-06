import { REDIS_KEY_PREFIX } from '../memory.constants';

export function userMemoryKey(userId: number): string {
  return `${REDIS_KEY_PREFIX}memory:user:${userId}`;
}

export function sessionContextKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}context:session:${sessionId}`;
}

export function agentRuntimeKey(appClientId: number, agentId: number): string {
  return `${REDIS_KEY_PREFIX}runtime:agent:${appClientId}:${agentId}`;
}

export function sessionPrepareKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}prepare:session:${sessionId}`;
}

export function pendingWriteConfirmationKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}pending-write:${sessionId}`;
}

/** 当前启用的 chat LlmModelConfig（按 kind 单活跃行）。 */
export function llmModelConfigActiveKey(kind: string): string {
  return `${REDIS_KEY_PREFIX}config:llm:${kind}:active`;
}

/** IntentRecallConfig singletonKey=1 */
export function intentRecallConfigKey(): string {
  return `${REDIS_KEY_PREFIX}config:intent-recall:1`;
}
