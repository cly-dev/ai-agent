import type { HostActionHostToolInvocation } from '../host-bridge/host-action.types';
import { dispatchHostActionInstant } from '../host-bridge/host-action-instant-dispatch.util';
import { parseHostToolArgsFromLlmText } from '../host-bridge/host-tool-args-from-llm.util';
import {
  hostToolContractWillDispatchLive,
  resolveHostToolDeliveryContract,
} from '../host-bridge/host-tool-delivery-contract.util';
import { isHostToolStreamEnabled } from '../host-bridge/host-tool-stream-env.util';
import { HostToolStreamSession } from '../host-bridge/host-tool-stream-session.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import { buildPlanHostFillsFromMachineText } from '../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util';
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
  logPageActionFillStart,
  logPageActionFillStreamEnd,
  recordPageActionFillStreamDelta,
  truncateForPageActionLog,
} from './page-action-fill-debug.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
import { executePageActionLlmDslStream } from './page-action-llm-dsl-stream.util';

export type PageActionHostFillExecuteInput = {
  actionRunId: number;
  actionKey: string;
  generation: number;
  clientActionId?: string | null;
  systemPrompt: string;
  messages: LlmChatMessage[];
  pageContext: AgentChatPageContext | null;
  /** PageAction invoke.context；供 HostTool x-contextIdCatalog */
  actionContext?: Record<string, unknown> | null;
  hostTool: ResolvedPageActionHostTool;
  sseSink: PageActionSseSink;
  signal?: AbortSignal;
  stepRecorder?: PageActionRunStepRecorder;
  /** self：本函数发 lifecycle 并 end SSE；delegated：由 workflow executor 统一终态。 */
  terminalLifecycle?: 'self' | 'delegated';
  /** host_action DSL streamId 分段（如 workflow nodeId） */
  streamIdSegment?: string | null;
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
  const terminalLifecycle = input.terminalLifecycle ?? 'self';
  const contract = resolveHostToolDeliveryContract(input.hostTool.definition);
  const willDispatchLive = hostToolContractWillDispatchLive(
    contract,
    isHostToolStreamEnabled(),
  );
  const streamId = buildPageActionStreamId({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    segment: input.streamIdSegment,
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
  const emitOwnLifecycle = terminalLifecycle === 'self';
  if (emitOwnLifecycle) {
    writePageActionLifecycle(
      sink,
      { phase: 'started', ...lifecycleBase(input, streamId) },
      recorder,
    );
  }

  let dslOutcome: 'dispatched' | 'failed' | 'skipped' = 'skipped';
  let fillText = '';
  let displayText = '';

  try {
    logPageActionFillStart(probe);

    const streamResult = await executePageActionLlmDslStream({
      llmService,
      messages: input.messages,
      sseSink: sink,
      pageContext: input.pageContext,
      actionContext: input.actionContext ?? null,
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      generation: input.generation,
      streamId,
      hostTool: input.hostTool,
      reason: PAGE_ACTION_STREAM_REASON,
      stepRecorder: recorder,
      signal: input.signal,
      // instant：主路径 decision；stream 兜底在 dsl-stream 内改用 summarize。fill_stream 整段 summarize。
      budgetHints: {
        callKind:
          contract.delivery === 'instant' && contract.produceMode === 'structured'
            ? 'decision'
            : 'summarize',
      },
      onLlmDelta: (delta) => {
        recordPageActionFillStreamDelta(
          probe,
          delta.contentDelta,
          delta.done === true,
        );
      },
    });

    model = streamResult.model;
    fillText = streamResult.fillText;
    displayText = streamResult.displayText;
    appendCount = streamResult.appendCount;
    promptTokens = streamResult.promptTokens;
    completionTokens = streamResult.completionTokens;
    dslOutcome = streamResult.dslOutcome;
    llmCallCount = streamResult.llmCallCount;

    logPageActionFillStreamEnd({
      probe,
      model,
      sessionFillTextLen: fillText.length,
      streamResultContentLen: fillText.length,
      appendCount,
      rawAccumulatedLen: fillText.length,
      rawPreview: truncateForPageActionLog(fillText, 2000),
      streamResultPreview: truncateForPageActionLog(displayText, 2000),
      streamMeta: undefined,
    });

    if (dslOutcome === 'dispatched') {
      logPageActionFillDispatched({
        probe,
        fillTextLen: fillText.length,
        appendCount,
        fillTextPreview: truncateForPageActionLog(displayText, 500),
      });
    } else if (willDispatchLive && fillText.trim().length === 0) {
      logPageActionFillEmpty({
        probe,
        model,
        rawAccumulatedLen: 0,
        rawPreview: '',
        sanitizedFillLen: 0,
        streamResultContentLen: 0,
        streamResultPreview: '',
        appendCount,
      });
    }

    if (emitOwnLifecycle) {
      writePageActionLifecycle(
        sink,
        {
          phase: 'completed',
          ...lifecycleBase(input, streamId),
          // 展示用 displayText；权威 JSON 仍在返回的 fillText 里落库
          text: displayText || fillText,
          dslOutcome,
        },
        recorder,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logPageActionFillError(probe, error);
    recorder.recordLlm('streamChat.error', { message }, 'failed');
    if (emitOwnLifecycle) {
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
    }
    throw error;
  }

  if (emitOwnLifecycle) {
    endInlineSseResponse(sink);
  }
  return {
    fillText,
    dslOutcome,
    streamId: willDispatchLive ? streamId : null,
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
  let replayDslOutcome = input.dslOutcome;

  if (
    fillText &&
    input.dslOutcome === 'dispatched' &&
    input.hostTool
  ) {
    const contract = resolveHostToolDeliveryContract(input.hostTool.definition);
    const publish = createInlineHostActionPublisher(sink, {
      onPayload: (payload) => {
        recorder.recordHostActionPayload(payload);
      },
    });

    if (contract.delivery === 'fill_stream' && contract.streamablePath) {
      const fillTools = [
        {
          name: input.hostTool.definition.name,
          streamablePath: contract.streamablePath,
        },
      ];
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
        replayDslOutcome = 'failed';
        recorder.record({
          type: 'dsl',
          name: 'stream.replay_failed',
          status: 'failed',
          detail: { reason: 'empty_fill_on_replay', delivery: 'fill_stream' },
        });
      }
    } else if (contract.delivery === 'instant') {
      const args = parseHostToolArgsFromLlmText({
        text: fillText,
        argsSchema: input.hostTool.definition.argsSchema,
      });
      if (args) {
        dispatchHostActionInstant(publish, `page-action:${input.actionRunId}`, {
          pageContext: input.pageContext,
          runId: input.actionRunId,
          turnId: input.actionRunId,
          hostTools: [{ name: input.hostTool.definition.name, args }],
          reason: PAGE_ACTION_STREAM_REASON,
          streamId,
          generation: input.generation,
        });
      } else {
        // 避免假 dispatched：重放未能下发 host_action 时降级并记账
        replayDslOutcome = 'failed';
        recorder.record({
          type: 'dsl',
          name: 'instant.replay_failed',
          status: 'failed',
          detail: {
            reason: 'structured_args_parse_or_validate_failed',
            delivery: 'instant',
            fillTextLen: fillText.length,
          },
        });
      }
    }
  }

  writePageActionLifecycle(
    sink,
    {
      phase: 'completed',
      ...lifecycle,
      text: fillText,
      dslOutcome: replayDslOutcome,
    },
    recorder,
  );
  endInlineSseResponse(sink);
  return recorder.toJson();
}
