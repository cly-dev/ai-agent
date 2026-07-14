import type { HostActionSsePayload } from '../host-bridge/host-action.types';
import type { HostActionEventPublisher } from '../host-bridge/host-action-dispatch.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { WorkflowActionKind } from '../workflow/workflow.types';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';

export type PageActionSseTarget = PageActionSseSink;

function resolveSseTarget(target: PageActionSseTarget): PageActionSseSink {
  return target;
}

export type PageActionSsePhase =
  | 'started'
  | 'stream'
  | 'completed'
  | 'failed'
  | 'awaiting_approval';

export type PageWorkflowNodeSsePhase =
  | 'start'
  | 'complete'
  | 'failed'
  | 'awaiting_approval';

export type PageWorkflowNodeSsePayload = {
  phase: PageWorkflowNodeSsePhase;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  nodeId: string;
  action: WorkflowActionKind;
  workflowStatus?: string;
  currentNodeId?: string | null;
  outputRef?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export type PageActionLifecyclePayload = {
  phase: PageActionSsePhase;
  actionRunId: number;
  actionKey: string;
  delivery: string;
  /** 与 host_action.generation 一致，用于并发 invoke 去重 */
  generation: number;
  streamId?: string | null;
  clientActionId?: string | null;
  text?: string;
  dslOutcome?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export function writeSseEvent(
  target: PageActionSseTarget,
  event: string,
  data: unknown,
): void {
  const sink = resolveSseTarget(target);
  if (sink.writableEnded) {
    return;
  }
  sink.emit(event, data);
}

export function createInlineHostActionPublisher(
  target: PageActionSseTarget,
  options?: {
    onPayload?: (payload: HostActionSsePayload) => void;
  },
): HostActionEventPublisher {
  return (_sessionId, envelope) => {
    options?.onPayload?.(envelope.payload);
    writeSseEvent(target, 'host_action', envelope.payload);
  };
}

/** 总结 prose 增量；不写 run steps，避免逐步骤膨胀。 */
export function writePageActionStreamDelta(
  target: PageActionSseTarget,
  payload: Omit<PageActionLifecyclePayload, 'phase'> & {
    phase?: 'stream';
    text: string;
  },
): void {
  if (target.writableEnded || !payload.text) {
    return;
  }
  writeSseEvent(target, 'page_action', {
    ...payload,
    phase: 'stream' as const,
  });
}

export function writePageActionLifecycle(
  target: PageActionSseTarget,
  payload: PageActionLifecyclePayload,
  recorder?: PageActionRunStepRecorder,
): void {
  recorder?.recordLifecycle(payload.phase, {
    actionRunId: payload.actionRunId,
    actionKey: payload.actionKey,
    delivery: payload.delivery,
    generation: payload.generation,
    streamId: payload.streamId ?? null,
    clientActionId: payload.clientActionId ?? null,
    dslOutcome: payload.dslOutcome ?? null,
    errorCode: payload.errorCode ?? null,
    errorMessage: payload.errorMessage ?? null,
    textLength: payload.text?.length ?? null,
  }, payload.phase === 'failed' ? 'failed' : payload.phase === 'completed' ? 'ok' : undefined);
  writeSseEvent(target, 'page_action', payload);
}

export function writePageWorkflowNodeSse(
  target: PageActionSseTarget,
  payload: PageWorkflowNodeSsePayload,
): void {
  const sink = resolveSseTarget(target);
  if (sink.writableEnded) {
    return;
  }
  writeSseEvent(sink, 'page_workflow', payload);
}

export function endInlineSseResponse(target: PageActionSseTarget): void {
  resolveSseTarget(target).end();
}
