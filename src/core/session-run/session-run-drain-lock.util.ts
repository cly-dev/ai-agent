import type { SessionRunStateStore } from '../memory/session-run/session-run-state.store';

/** 应小于 Redis drain lock TTL（默认 5min），周期性续期避免长任务期间锁过期。 */
export const SESSION_RUN_DRAIN_LOCK_RENEW_MS = 60_000;

/**
 * 在持有 per-session drain lock 时执行 fn；执行期间自动 renew。
 * `alreadyHeld: true` 时假定调用方已 acquire（BullMQ worker 路径）。
 */
export async function runWithSessionDrainLock(
  runState: SessionRunStateStore,
  sessionId: string,
  fn: () => Promise<void>,
  options?: { alreadyHeld?: boolean },
): Promise<void> {
  if (!options?.alreadyHeld) {
    const acquired = await runState.acquireDrainLock(sessionId);
    if (!acquired) {
      throw new Error('SESSION_DRAIN_LOCK_NOT_ACQUIRED');
    }
  }
  const timer = setInterval(() => {
    void runState.renewDrainLock(sessionId);
  }, SESSION_RUN_DRAIN_LOCK_RENEW_MS);
  try {
    await fn();
  } finally {
    clearInterval(timer);
    await runState.releaseDrainLock(sessionId);
  }
}
