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

/** Session run 单调 generation（跨实例 SSE 过滤权威值）。 */
export function sessionRunGenerationKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}session-run:gen:${sessionId}`;
}

/** Session runId → generation 绑定（HASH field = runId）。 */
export function sessionRunBindingsKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}session-run:bindings:${sessionId}`;
}

/** 当前 active run 快照（供 run-state API / 多 Tab 对齐）。 */
export function sessionRunActiveKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}session-run:active:${sessionId}`;
}

/** 旧版 per-session Redis LIST 队列 key（BullMQ 迁移后仅清理遗留）。 */
export function sessionRunQueueKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}session-run:queue:${sessionId}`;
}

/** 单 session 同时仅一个实例 drain（SET NX）。 */
export function sessionRunDrainLockKey(sessionId: string): string {
  return `${REDIS_KEY_PREFIX}session-run:drain-lock:${sessionId}`;
}

/** 跨实例 supersede 广播（payload: SessionRunSupersedeEvent JSON）。 */
export const SESSION_RUN_SUPERSEDE_CHANNEL = `${REDIS_KEY_PREFIX}session-run:supersede`;

/** 跨实例 Chat SSE 中继（payload: ChatSseRelayMessage JSON）。 */
export const CHAT_SSE_RELAY_CHANNEL = `${REDIS_KEY_PREFIX}chat:sse-relay`;

/** 当前启用的 chat LlmModelConfig（按 kind 单活跃行）。 */
export function llmModelConfigActiveKey(kind: string): string {
  return `${REDIS_KEY_PREFIX}config:llm:${kind}:active`;
}

/** IntentRecallConfig singletonKey=1 */
export function intentRecallConfigKey(): string {
  return `${REDIS_KEY_PREFIX}config:intent-recall:1`;
}
