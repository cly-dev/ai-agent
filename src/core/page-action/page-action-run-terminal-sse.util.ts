import {
  PageActionDelivery,
  PageActionRunStatus,
} from '../../../generated/prisma/client';
import { buildPageActionStreamId } from './page-action.constants';
import {
  endInlineSseResponse,
  writePageActionLifecycle,
} from './page-action-inline-sse.util';
import type { PageActionRunCompletion } from './page-action-run-completion.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';

export type PageActionRunTerminalPhase =
  | 'awaiting_approval'
  | 'completed'
  | 'failed';

export type PageActionRunTerminalOutcome = {
  phase: PageActionRunTerminalPhase;
  fillText: string | null;
  errorCode: string | null;
  errorMessage: string | null;
};

/** 将编排层 completion 映射为 DB / SSE 终态。 */
export function resolvePageActionRunTerminalOutcome(
  completion: PageActionRunCompletion,
): PageActionRunTerminalOutcome {
  switch (completion.kind) {
    case 'suspended':
      return {
        phase: 'awaiting_approval',
        fillText: null,
        errorCode: null,
        errorMessage: null,
      };
    case 'failed':
      return {
        phase: 'failed',
        fillText: null,
        errorCode: completion.errorCode,
        errorMessage: completion.errorMessage,
      };
    case 'text':
      return {
        phase: 'completed',
        fillText: completion.fillText,
        errorCode: null,
        errorMessage: null,
      };
    case 'http_write':
    case 'http_read':
    case 'workflow_done':
      return {
        phase: 'completed',
        fillText: null,
        errorCode: null,
        errorMessage: null,
      };
  }
}

export function mapTerminalPhaseToRunStatus(
  phase: PageActionRunTerminalPhase,
): PageActionRunStatus {
  switch (phase) {
    case 'awaiting_approval':
      return PageActionRunStatus.awaiting_approval;
    case 'failed':
      return PageActionRunStatus.failed;
    case 'completed':
      return PageActionRunStatus.completed;
  }
}

export function emitPageActionRunTerminalSse(input: {
  sseSink: PageActionSseSink;
  recorder: PageActionRunStepRecorder;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId: string | null;
  streamId: string | null;
  outcome: PageActionRunTerminalOutcome;
  dslOutcome?: string | null;
}): void {
  const lifecycleBase = {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    delivery: PageActionDelivery.inline_stream,
    generation: input.generation,
    streamId:
      input.streamId ??
      buildPageActionStreamId({
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
      }),
    clientActionId: input.clientActionId,
  };

  if (input.outcome.phase === 'awaiting_approval') {
    writePageActionLifecycle(
      input.sseSink,
      {
        phase: 'awaiting_approval',
        ...lifecycleBase,
      },
      input.recorder,
    );
    return;
  }

  if (input.outcome.phase === 'failed') {
    writePageActionLifecycle(
      input.sseSink,
      {
        phase: 'failed',
        ...lifecycleBase,
        errorCode: input.outcome.errorCode ?? 'RUN_FAILED',
        errorMessage:
          input.outcome.errorMessage ??
          input.outcome.errorCode ??
          'Page action run failed',
      },
      input.recorder,
    );
    endInlineSseResponse(input.sseSink);
    return;
  }

  writePageActionLifecycle(
    input.sseSink,
    {
      phase: 'completed',
      ...lifecycleBase,
      text: input.outcome.fillText ?? undefined,
      dslOutcome: input.dslOutcome ?? null,
    },
    input.recorder,
  );
  endInlineSseResponse(input.sseSink);
}
