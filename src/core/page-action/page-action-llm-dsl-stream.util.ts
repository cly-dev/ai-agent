import {
  buildPlanHostFillsFromMachineText,
  createPlanReasonHostFillStreamTextSession,
  runHostFillLlmStream,
} from '../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util';
import type { HostActionHostToolInvocation } from '../host-bridge/host-action.types';
import { isHostToolStreamEnabled } from '../host-bridge/host-tool-stream-env.util';
import { HostToolStreamSession } from '../host-bridge/host-tool-stream-session.util';
import { resolvePlanReasonHostFillTools } from '../host-bridge/host-tool-stream-target.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import type { PromptBudgetHints } from '../llm/prompt-budget/prompt-budget.types';
import {
  extractLlmTokenUsageFromResponseMeta,
  resolveLlmModelNameFromResponseMeta,
} from '../llm/llm-response-meta.util';
import { createInlineHostActionPublisher } from './page-action-inline-sse.util';
import type { ResolvedPageActionHostTool } from './page-action-host-tool.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';

export type PageActionLlmDslStreamResult = {
  fillText: string;
  dslOutcome: 'dispatched' | 'failed' | 'skipped';
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  appendCount: number;
  streamable: boolean;
};

function toHostToolInvocations(
  fills: Array<{ tool: string; arguments: Record<string, unknown> }>,
): HostActionHostToolInvocation[] {
  return fills.map((fill) => ({
    name: fill.tool,
    args: fill.arguments,
  }));
}

function responseMetaFromStreamRaw(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }
  const row = raw as Record<string, unknown>;
  const responseMeta = row.response_metadata;
  if (responseMeta && typeof responseMeta === 'object' && !Array.isArray(responseMeta)) {
    return responseMeta as Record<string, unknown>;
  }
  return row;
}

function resolveDslOutcomeWithoutDispatch(fillText: string): 'failed' | 'skipped' {
  return fillText.trim().length > 0 ? 'skipped' : 'failed';
}

export function canPageActionUseDslStream(hostTool: ResolvedPageActionHostTool): boolean {
  if (!isHostToolStreamEnabled()) {
    return false;
  }
  const fillTools = resolvePlanReasonHostFillTools({
    hostTools: [hostTool.definition],
    allowedToolNames: new Set([hostTool.definition.name]),
  });
  return fillTools.length > 0;
}

/**
 * PageAction 共用：LLM streamChat → sanitize →（可选）host_action DSL arg.append。
 * 始终执行 LLM；仅当存在可流式字段且 HOST_TOOL_STREAM 开启时才 dispatch DSL。
 */
export async function executePageActionLlmDslStream(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  sseSink: PageActionSseSink;
  pageContext: AgentChatPageContext | null;
  actionRunId: number;
  generation: number;
  streamId: string;
  hostTool: ResolvedPageActionHostTool;
  reason: string;
  stepRecorder?: PageActionRunStepRecorder;
  signal?: AbortSignal;
  budgetHints?: PromptBudgetHints;
  llmAudit?: { startName?: string; endName?: string };
  onLlmDelta?: (delta: { contentDelta: string; done?: boolean }) => void;
}): Promise<PageActionLlmDslStreamResult> {
  const recorder = input.stepRecorder;
  const fillTools = resolvePlanReasonHostFillTools({
    hostTools: [input.hostTool.definition],
    allowedToolNames: new Set([input.hostTool.definition.name]),
  });
  const hasStreamableField = fillTools.length > 0;
  const canDispatchDsl = hasStreamableField && isHostToolStreamEnabled();
  let model: string | null = null;
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  let appendCount = 0;
  let fillText = '';
  let dslOutcome: 'dispatched' | 'failed' | 'skipped' = 'skipped';
  let streamSession: HostToolStreamSession | null = null;

  if (!hasStreamableField) {
    recorder?.record({
      type: 'dsl',
      name: 'stream.skipped',
      status: 'skipped',
      detail: { reason: 'no_streamable_string_field' },
    });
  } else if (!isHostToolStreamEnabled()) {
    recorder?.record({
      type: 'dsl',
      name: 'stream.skipped',
      status: 'skipped',
      detail: { reason: 'host_tool_stream_disabled' },
    });
  }

  if (canDispatchDsl) {
    const publish = createInlineHostActionPublisher(input.sseSink, {
      onPayload: (payload) => {
        recorder?.recordHostActionPayload(payload);
      },
    });
    streamSession = new HostToolStreamSession({
      publish,
      sessionId: `page-action:${input.actionRunId}`,
      pageContext: input.pageContext ?? {},
      runId: input.actionRunId,
      turnId: input.actionRunId,
      reason: input.reason,
      generation: input.generation,
    });

    streamSession.begin({
      streamId: input.streamId,
      tools: fillTools,
      reason: input.reason,
    });
  }

  const textSession = createPlanReasonHostFillStreamTextSession({
    onSanitizedDelta: (delta) => {
      streamSession?.appendFillChunk(delta);
    },
  });

  const startName = input.llmAudit?.startName ?? 'streamChat.start';
  const endName = input.llmAudit?.endName ?? 'streamChat.end';
  recorder?.recordLlm(startName, {
    messageCount: input.messages.length,
    streamableTools: fillTools.map((tool) => tool.name),
    dslDispatch: canDispatchDsl,
  });

  try {
    const llmFill = await runHostFillLlmStream({
      llmService: input.llmService,
      messages: input.messages,
      textSession,
      signal: input.signal,
      budgetHints: input.budgetHints,
      onLlmDelta: (delta) => {
        input.onLlmDelta?.(delta);
      },
    });

    model = llmFill.model;
    fillText = llmFill.fillText;
    appendCount = llmFill.appendCount;
    const responseMeta = responseMetaFromStreamRaw(llmFill.streamResult.raw);
    const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
    promptTokens = usage?.promptTokens ?? null;
    completionTokens = usage?.completionTokens ?? null;
    if (!model) {
      model = resolveLlmModelNameFromResponseMeta(responseMeta);
    }

    recorder?.recordLlm(endName, {
      model,
      appendCount,
      sessionFillTextLen: fillText.length,
      streamResultContentLen: llmFill.streamResult.content?.length ?? 0,
      rawAccumulatedLen: llmFill.rawAccumulatedLen,
      reconciledFromStreamResult: llmFill.reconciledFromStreamResult,
      fellBackToInvoke:
        llmFill.streamResult.streamMeta?.fellBackToInvoke ?? false,
      llmEmittedDeltaCount:
        llmFill.streamResult.streamMeta?.emittedDeltaCount ?? null,
      promptTokens,
      completionTokens,
      dslDispatch: canDispatchDsl,
    });

    if (canDispatchDsl && streamSession) {
      const fills = buildPlanHostFillsFromMachineText({
        text: fillText,
        fillTools,
        allowedToolNames: new Set([input.hostTool.definition.name]),
      });
      if (fills.length > 0) {
        streamSession.finalize({
          hostTools: toHostToolInvocations(fills),
          reason: input.reason,
        });
        dslOutcome = 'dispatched';
      } else {
        streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
        dslOutcome = 'failed';
        recorder?.record({
          type: 'dsl',
          name: 'stream.failed',
          status: 'failed',
          detail: {
            reason: 'empty_fill_after_llm',
            rawAccumulatedLen: llmFill.rawAccumulatedLen,
            streamResultContentLen: llmFill.streamResult.content?.length ?? 0,
          },
        });
      }
    } else {
      dslOutcome = resolveDslOutcomeWithoutDispatch(fillText);
    }
  } catch (error) {
    if (streamSession?.hasBegun && !streamSession.isClosed) {
      streamSession.abort({ emitSessionEnd: true });
    }
    throw error;
  }

  return {
    fillText,
    dslOutcome,
    model,
    promptTokens,
    completionTokens,
    appendCount,
    streamable: hasStreamableField,
  };
}
