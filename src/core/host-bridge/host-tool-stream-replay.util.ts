import type { HostActionSsePayload } from './host-action.types';
import {
  isHostActionBatchPayload,
  isHostActionStreamPayload,
} from './host-tool-stream.types';

/** SSE 重放：v0 批量与 stream.mode=full 可恢复终态；delta 帧仅 live 消费。 */
export function shouldReplayHostAction(payload: HostActionSsePayload): boolean {
  if (isHostActionBatchPayload(payload)) {
    return payload.hostTools.length > 0;
  }
  if (isHostActionStreamPayload(payload)) {
    return payload.stream.mode === 'full';
  }
  return false;
}
