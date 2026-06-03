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
