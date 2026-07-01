import type { HostActionHostToolInvocation } from './host-action.types';
import type { HostActionEventPublisher } from './host-action-dispatch.util';
import type { HostActionSsePayload } from './host-action.types';
import type { AgentChatPageContext } from './page-context.types';
import { HostToolStreamSession } from './host-tool-stream-session.util';
import { buildHostToolStreamId } from './host-tool-stream-target.util';

export type DispatchHostActionInstantInput = {
  pageContext?: AgentChatPageContext | null;
  runId: number;
  turnId: number;
  hostTools: HostActionHostToolInvocation[];
  planStepId?: string | null;
  reason?: string;
  streamId?: string;
  generation?: number;
};

/**
 * 动作类 host_action：完整 DSL v1 帧序（tool.flush，无 append）。
 * 返回 mode=full 权威快照，供 run step / 重放使用。
 */
export function dispatchHostActionInstant(
  publish: HostActionEventPublisher,
  sessionId: string,
  input: DispatchHostActionInstantInput,
): HostActionSsePayload | null {
  if (input.hostTools.length === 0) {
    return null;
  }
  const streamId =
    input.streamId ??
    buildHostToolStreamId({
      runId: input.runId,
      turnId: input.turnId,
      stepId: input.planStepId?.trim() || 'dispatch',
    });
  const session = new HostToolStreamSession({
    publish,
    sessionId,
    pageContext: input.pageContext ?? {},
    runId: input.runId,
    turnId: input.turnId,
    planStepId: input.planStepId,
    reason: input.reason,
    generation: input.generation,
  });
  return session.dispatchInstant({
    streamId,
    hostTools: input.hostTools,
    reason: input.reason,
  });
}
