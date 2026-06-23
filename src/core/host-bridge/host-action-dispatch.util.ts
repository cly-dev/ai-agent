import type { HostActionSsePayload } from './host-action.types';
import { isHostActionBatchPayload } from './host-tool-stream.types';

export type HostActionEventPublisher = (
  sessionId: string,
  envelope: { event: 'host_action'; payload: HostActionSsePayload },
) => void;

/** 统一 SSE host_action 推送（v0 批量 / v1 DSL 流式帧）。 */
export function dispatchHostActionSse(
  publish: HostActionEventPublisher,
  sessionId: string,
  payload: HostActionSsePayload,
): void {
  if (isHostActionBatchPayload(payload) && !payload.hostTools.length) {
    return;
  }
  publish(sessionId, { event: 'host_action', payload });
}
