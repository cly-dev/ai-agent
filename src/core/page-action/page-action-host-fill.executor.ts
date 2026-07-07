import {
  buildPlanHostFillsFromMachineText,
  createPlanReasonHostFillStreamTextSession,
  runHostFillLlmStream,
} from '../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util';
import type { HostActionHostToolInvocation } from '../host-bridge/host-action.types';
import { HostToolStreamSession } from '../host-bridge/host-tool-stream-session.util';
import { resolvePlanReasonHostFillTools } from '../host-bridge/host-tool-stream-target.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import {
  PAGE_ACTION_STREAM_REASON,
  buildPageActionStreamId,
} from './page-action.constants';
import {
  createInlineHostActionPublisher,
  endInlineSseResponse,
  writePageActionLifecycle,
} from './page-action-inline-sse.util';
import type { ResolvedPageActionHostTool } from './page-action-host-tool.util';
import {
  PageActionRunStepRecorder,
  type PageActionRunStep,
} from './page-action-run-steps.util';
import {
  createPageActionFillStreamProbe,
  logPageActionFillDispatched,
  logPageActionFillEmpty,
  logPageActionFillError,
  logPageActionFillFallback,
  logPageActionFillStart,
  logPageActionFillStreamEnd,
  recordPageActionFillStreamDelta,
  truncateForPageActionLog,
} from './page-action-fill-debug.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';

export type PageActionHostFillExecuteInput = {
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  systemPrompt: string;
  messages: LlmChatMessage[];
  pageContext: AgentChatPageContext | null;
  hostTool: ResolvedPageActionHostTool;
  sseSink: PageActionSseSink;
  signal?: AbortSignal;
  stepRecorder?: PageActionRunStepRecorder;
};

export type PageActionHostFillExecuteResult = {
  fillText: string;
  dslOutcome: 'dispatched' | 'failed' | 'skipped' | null;
  streamId: string | null;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  llmCallCount: number;
  appendCount: number;
  steps: PageActionRunStep[];
};

function toHostToolInvocations(
  fills: Array<{ tool: string; arguments: Record<string, unknown> }>,
): HostActionHostToolInvocation[] {
  return fills.map((fill) => ({
    name: fill.tool,
    args: fill.arguments,
  }));
}

function lifecycleBase(input: PageActionHostFillExecuteInput, streamId: string) {
  return {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    delivery: 'inline_stream' as const,
    generation: input.generation,
    streamId,
    clientActionId: input.clientActionId ?? null,
  };
}

export async function executePageActionHostFill(
  llmService: LlmService,
  input: PageActionHostFillExecuteInput,
): Promise<PageActionHostFillExecuteResult> {
  const recorder = input.stepRecorder ?? new PageActionRunStepRecorder();
  const fillTools = resolvePlanReasonHostFillTools({
    hostTools: [input.hostTool.definition],
    allowedToolNames: new Set([input.hostTool.definition.name]),
  });
  const streamId = buildPageActionStreamId({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
  });
  const probe = createPageActionFillStreamProbe({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    streamId,
  });

  let model: string | null = null;
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  let llmCallCount = 0;
  let appendCount = 0;

  const sink = input.sseSink;
  writePageActionLifecycle(
    sink,
    { phase: 'started', ...lifecycleBase(input, streamId) },
    recorder,
  );

  let dslOutcome: 'dispatched' | 'failed' | 'skipped' = 'skipped';
  let fillText = '';
  const canDispatchDsl = fillTools.length > 0;
  let streamSession: HostToolStreamSession | null = null;

  try {
    const pageContext = input.pageContext ?? {};
    const publish = createInlineHostActionPublisher(sink, {
      onPayload: (payload) => {
        recorder.recordHostActionPayload(payload);
      },
    });
    streamSession = new HostToolStreamSession({
      publish,
      sessionId: `page-action:${input.actionRunId}`,
      pageContext,
      runId: input.actionRunId,
      turnId: input.actionRunId,
      reason: PAGE_ACTION_STREAM_REASON,
      generation: input.generation,
    });

    if (canDispatchDsl) {
      streamSession.begin({
        streamId,
        tools: fillTools,
        reason: PAGE_ACTION_STREAM_REASON,
      });
    } else {
      recorder.record({
        type: 'dsl',
        name: 'stream.skipped',
        status: 'skipped',
        detail: { reason: 'no_streamable_string_field' },
      });
    }

    const textSession = createPlanReasonHostFillStreamTextSession({
      onSanitizedDelta: canDispatchDsl
        ? (delta) => {
            streamSession!.appendFillChunk(delta);
          }
        : undefined,
    });

    llmCallCount += 1;
    recorder.recordLlm('streamChat.start', {
      messageCount: input.messages.length,
      streamableTools: fillTools.map((tool) => tool.name),
    });
    logPageActionFillStart(probe);

    const llmFill = await runHostFillLlmStream({
      llmService,
      messages: input.messages,
      textSession,
      signal: input.signal,
      onLlmDelta: (delta) => {
        recordPageActionFillStreamDelta(
          probe,
          delta.contentDelta,
          delta.done === true,
        );
      },
    });

    model = llmFill.model;
    fillText = llmFill.fillText;
    appendCount = llmFill.appendCount;
    const rawAccumulatedText = textSession.getRawAccumulatedText();
    const streamResultContentLen = llmFill.streamResult.content?.length ?? 0;

    if (llmFill.reconciledFromStreamResult) {
      logPageActionFillFallback({
        probe,
        source: 'streamResult.content',
        beforeLen: 0,
        afterLen: fillText.length,
        preview: truncateForPageActionLog(fillText, 500),
      });
    }

    probe.routedMessageChars = llmFill.routedMessageChars;

    logPageActionFillStreamEnd({
      probe,
      model,
      sessionFillTextLen: fillText.length,
      streamResultContentLen,
      appendCount,
      rawAccumulatedLen: llmFill.rawAccumulatedLen,
      rawPreview: truncateForPageActionLog(rawAccumulatedText, 2000),
      streamResultPreview: truncateForPageActionLog(
        llmFill.streamResult.content ?? '',
        2000,
      ),
      streamMeta: llmFill.streamResult.streamMeta,
    });

    recorder.recordLlm('streamChat.end', {
      model,
      appendCount,
      deltaEvents: probe.deltaEvents,
      emptyDeltaEvents: probe.emptyDeltaEvents,
      deltaChars: probe.deltaChars,
      routedMessageChars: llmFill.routedMessageChars,
      sessionFillTextLen: fillText.length,
      streamResultContentLen,
      rawAccumulatedLen: llmFill.rawAccumulatedLen,
      reconciledFromStreamResult: llmFill.reconciledFromStreamResult,
      fellBackToInvoke: llmFill.streamResult.streamMeta?.fellBackToInvoke ?? false,
      llmEmittedDeltaCount:
        llmFill.streamResult.streamMeta?.emittedDeltaCount ?? null,
    });

    if (canDispatchDsl) {
      const fills = buildPlanHostFillsFromMachineText({
        text: fillText,
        fillTools,
        allowedToolNames: new Set([input.hostTool.definition.name]),
      });
      if (fills.length > 0) {
        streamSession.finalize({
          hostTools: toHostToolInvocations(fills),
          reason: PAGE_ACTION_STREAM_REASON,
        });
        dslOutcome = 'dispatched';
      } else {
        streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
        dslOutcome = 'failed';
        logPageActionFillEmpty({
          probe,
          model,
          rawAccumulatedLen: llmFill.rawAccumulatedLen,
          rawPreview: truncateForPageActionLog(rawAccumulatedText, 2000),
          sanitizedFillLen: fillText.length,
          streamResultContentLen,
          streamResultPreview: truncateForPageActionLog(
            llmFill.streamResult.content ?? '',
            2000,
          ),
          appendCount,
        });
        recorder.record({
          type: 'dsl',
          name: 'stream.failed',
          status: 'failed',
          detail: {
            reason: 'empty_fill_after_llm',
            rawAccumulatedLen: llmFill.rawAccumulatedLen,
            streamResultContentLen,
            deltaEvents: probe.deltaEvents,
            emptyDeltaEvents: probe.emptyDeltaEvents,
          },
        });
      }
    } else {
      dslOutcome = fillText.trim().length > 0 ? 'skipped' : 'failed';
    }

    if (dslOutcome === 'dispatched') {
      logPageActionFillDispatched({
        probe,
        fillTextLen: fillText.length,
        appendCount,
        fillTextPreview: truncateForPageActionLog(fillText, 500),
      });
    }

    writePageActionLifecycle(
      sink,
      {
        phase: 'completed',
        ...lifecycleBase(input, streamId),
        text: fillText,
        dslOutcome,
      },
      recorder,
    );
  } catch (error) {
    if (streamSession?.hasBegun && !streamSession.isClosed) {
      streamSession.abort({ emitSessionEnd: true });
    }
    const message = error instanceof Error ? error.message : String(error);
    logPageActionFillError(probe, error);
    recorder.recordLlm('streamChat.error', { message }, 'failed');
    writePageActionLifecycle(
      sink,
      {
        phase: 'failed',
        ...lifecycleBase(input, streamId),
        errorCode: 'LLM_FAILED',
        errorMessage: message,
      },
      recorder,
    );
    endInlineSseResponse(sink);
    throw error;
  }

  endInlineSseResponse(sink);
  return {
    fillText,
    dslOutcome,
    streamId: canDispatchDsl ? streamId : null,
    model,
    promptTokens,
    completionTokens,
    llmCallCount,
    appendCount,
    steps: recorder.toJson(),
  };
}

/** 幂等命中时重放已完成的 inline_stream SSE，不重复调用 LLM。 */
export async function replayPageActionInlineStream(input: {
  sseSink: PageActionSseSink;
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  fillText: string | null;
  dslOutcome: string | null;
  streamId: string | null;
  pageContext: AgentChatPageContext | null;
  hostTool: ResolvedPageActionHostTool | null;
  stepRecorder?: PageActionRunStepRecorder;
}): Promise<PageActionRunStep[]> {
  const recorder = input.stepRecorder ?? new PageActionRunStepRecorder();
  const sink = input.sseSink;
  const streamId =
    input.streamId ??
    buildPageActionStreamId({
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
    });
  const lifecycle = {
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    delivery: 'inline_stream' as const,
    generation: input.generation,
    streamId,
    clientActionId: input.clientActionId ?? null,
  };

  writePageActionLifecycle(
    sink,
    { phase: 'started', ...lifecycle },
    recorder,
  );
  recorder.record({
    type: 'lifecycle',
    name: 'idempotency_replay',
    detail: { actionRunId: input.actionRunId },
  });

  const fillText = input.fillText?.trim() ?? '';

  if (
    fillText &&
    input.dslOutcome === 'dispatched' &&
    input.hostTool
  ) {
    const fillTools = resolvePlanReasonHostFillTools({
      hostTools: [input.hostTool.definition],
      allowedToolNames: new Set([input.hostTool.definition.name]),
    });
    if (fillTools.length > 0) {
    const publish = createInlineHostActionPublisher(sink, {
      onPayload: (payload) => {
        recorder.recordHostActionPayload(payload);
      },
    });
    const streamSession = new HostToolStreamSession({
      publish,
      sessionId: `page-action:${input.actionRunId}`,
      pageContext: input.pageContext ?? {},
      runId: input.actionRunId,
      turnId: input.actionRunId,
      reason: PAGE_ACTION_STREAM_REASON,
      generation: input.generation,
    });
    streamSession.begin({
      streamId,
      tools: fillTools,
      reason: PAGE_ACTION_STREAM_REASON,
    });
    streamSession.appendFillChunk(fillText);
    const fills = buildPlanHostFillsFromMachineText({
      text: fillText,
      fillTools,
      allowedToolNames: new Set([input.hostTool.definition.name]),
    });
    if (fills.length > 0) {
      streamSession.finalize({
        hostTools: toHostToolInvocations(fills),
        reason: PAGE_ACTION_STREAM_REASON,
      });
    } else {
      streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
    }
    }
  }

  writePageActionLifecycle(
    sink,
    {
      phase: 'completed',
      ...lifecycle,
      text: fillText,
      dslOutcome: input.dslOutcome,
    },
    recorder,
  );
  endInlineSseResponse(sink);
  return recorder.toJson();
}
