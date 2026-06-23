import { REDIS_KEY_PREFIX } from '../shared/memory.constants';

export function userMemoryKey(userId: number): string {
  return `${REDIS_KEY_PREFIX}memory:user:${userId}`;
}

export function sessionContextKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}context:session:${sessionId}`;
}

export function sessionGoaCacheKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}goa:session:${sessionId}`;
}

export function agentRuntimeKey(appClientId: number, agentId: number): string {
  return `${REDIS_KEY_PREFIX}runtime:agent:${appClientId}:${agentId}`;
}

export function sessionPrepareKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}prepare:session:${sessionId}`;
}

/** L1 会话运行快照（统一后首选 key） */
export function sessionRuntimeKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}runtime:session:${sessionId}`;
}

export function agentHostToolCatalogKey(
  appClientId: number,
  agentId: number,
): string {
  return `${REDIS_KEY_PREFIX}runtime:agent-host-tools:${appClientId}:${agentId}`;
}

export function agentToolCatalogKey(
  appClientId: number,
  agentId: number,
): string {
  return `${REDIS_KEY_PREFIX}runtime:agent-tools:${appClientId}:${agentId}`;
}

export function agentSkillCatalogKey(
  appClientId: number,
  agentId: number,
  roleId: number,
): string {
  return `${REDIS_KEY_PREFIX}runtime:agent-skills:${appClientId}:${agentId}:${roleId}`;
}

export function agentSkillCatalogScanPattern(
  appClientId: number,
  agentId: number,
): string {
  return `${REDIS_KEY_PREFIX}runtime:agent-skills:${appClientId}:${agentId}:*`;
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
