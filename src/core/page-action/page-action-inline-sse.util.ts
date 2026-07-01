import type { Response } from 'express';
import type { HostActionSsePayload } from '../host-bridge/host-action.types';
import type { HostActionEventPublisher } from '../host-bridge/host-action-dispatch.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { WorkflowActionKind } from '../workflow/workflow.types';

export type PageActionSsePhase =
  | 'started'
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
  res: Response,
  event: string,
  data: unknown,
): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function initInlineSseResponse(res: Response): void {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
}

export function createInlineHostActionPublisher(
  res: Response,
  options?: {
    onPayload?: (payload: HostActionSsePayload) => void;
  },
): HostActionEventPublisher {
  return (_sessionId, envelope) => {
    options?.onPayload?.(envelope.payload);
    writeSseEvent(res, 'host_action', envelope.payload);
  };
}

export function writePageActionLifecycle(
  res: Response,
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
  writeSseEvent(res, 'page_action', payload);
}

export function writePageWorkflowNodeSse(
  res: Response | Pick<Response, 'writableEnded' | 'write'>,
  payload: PageWorkflowNodeSsePayload,
): void {
  if (res.writableEnded || typeof res.write !== 'function') {
    return;
  }
  writeSseEvent(res as Response, 'page_workflow', payload);
}

export function endInlineSseResponse(res: Response): void {
  if (!res.writableEnded) {
    res.end();
  }
}
