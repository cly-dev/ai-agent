import {
  buildPlanHostFillsFromMachineText,
  createPlanReasonHostFillStreamTextSession,
  runHostFillLlmStream,
} from '../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util';
import { dispatchHostActionInstant } from '../host-bridge/host-action-instant-dispatch.util';
import type { HostActionHostToolInvocation } from '../host-bridge/host-action.types';
import {
  buildHostToolArgsDisplayText,
  parseHostToolArgsFromLlmText,
} from '../host-bridge/host-tool-args-from-llm.util';
import {
  hostToolContractWillDispatchLive,
  resolveHostToolDeliveryContract,
  type HostToolDeliveryContract,
} from '../host-bridge/host-tool-delivery-contract.util';
import { isHostToolStreamEnabled } from '../host-bridge/host-tool-stream-env.util';
import { HostToolStreamSession } from '../host-bridge/host-tool-stream-session.util';
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
  /** 持久化 / 重放权威：fill_stream 为正文；instant 为 canonical JSON。 */
  fillText: string;
  /** lifecycle / 用户可见文案；instant 为 string 叶子摘要。 */
  displayText: string;
  dslOutcome: 'dispatched' | 'failed' | 'skipped';
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  appendCount: number;
  /** true：fill_stream 可 arg.append；instant 为 false（但仍可能 dsl dispatched）。 */
  streamable: boolean;
  delivery: HostToolDeliveryContract['delivery'];
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

/** 将 argsSchema 约束并入已有 system 消息，避免再塞一条 user 干扰业务 prompt。 */
function withStructuredArgsHint(
  messages: LlmChatMessage[],
  argsSchema: Record<string, unknown>,
): LlmChatMessage[] {
  const hint =
    '\n\n[Host tool args] Reply with one JSON object matching this schema only ' +
    '(no markdown fences, no commentary):\n' +
    JSON.stringify(argsSchema);
  if (messages.length === 0) {
    return [{ role: 'system', content: hint.trim() }];
  }
  const [first, ...rest] = messages;
  if (first?.role === 'system') {
    return [{ role: 'system', content: `${first.content}${hint}` }, ...rest];
  }
  return [{ role: 'system', content: hint.trim() }, ...messages];
}

/**
 * PageAction 当前是否会真正下发 host_action DSL。
 * @deprecated 名称保留兼容；语义为 dispatch 而非仅 stream。
 */
export function canPageActionUseDslStream(
  hostTool: ResolvedPageActionHostTool,
): boolean {
  return canPageActionDispatchDsl(hostTool);
}

/** PageAction 当前运行时是否会发 host_action（fill_stream 或 instant）。 */
export function canPageActionDispatchDsl(
  hostTool: ResolvedPageActionHostTool,
): boolean {
  const contract = resolveHostToolDeliveryContract(hostTool.definition);
  return hostToolContractWillDispatchLive(contract, isHostToolStreamEnabled());
}

/**
 * PageAction 共用：按 HostTool 交付契约 produce → dispatch。
 * - fill_stream：LLM prose 流 + arg.append（需 HOST_TOOL_STREAM）
 * - instant：LLM 结构化 JSON → tool.flush（不要求顶层 string）
 * - observation：仅 LLM，不发 host_action
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
  const contract = resolveHostToolDeliveryContract(input.hostTool.definition);
  const streamEnabled = isHostToolStreamEnabled();
  const willDispatchLive = hostToolContractWillDispatchLive(
    contract,
    streamEnabled,
  );
  const fillStreamLive =
    contract.delivery === 'fill_stream' && streamEnabled;
  const fillTools =
    contract.streamablePath != null
      ? [
          {
            name: input.hostTool.definition.name,
            streamablePath: contract.streamablePath,
          },
        ]
      : [];

  if (contract.delivery === 'fill_stream' && !streamEnabled) {
    recorder?.record({
      type: 'dsl',
      name: 'stream.skipped',
      status: 'skipped',
      detail: { reason: 'host_tool_stream_disabled', delivery: contract.delivery },
    });
  } else if (contract.delivery === 'observation') {
    recorder?.record({
      type: 'dsl',
      name: 'stream.skipped',
      status: 'skipped',
      detail: { reason: 'observation_only', delivery: contract.delivery },
    });
  } else {
    recorder?.record({
      type: 'dsl',
      name: 'delivery.resolved',
      status: 'ok',
      detail: {
        delivery: contract.delivery,
        produceMode: contract.produceMode,
        streamablePath: contract.streamablePath,
        willDispatchLive,
      },
    });
  }

  let model: string | null = null;
  let promptTokens: number | null = null;
  let completionTokens: number | null = null;
  let appendCount = 0;
  let fillText = '';
  let displayText = '';
  let dslOutcome: 'dispatched' | 'failed' | 'skipped' = 'skipped';
  let streamSession: HostToolStreamSession | null = null;

  const publish = createInlineHostActionPublisher(input.sseSink, {
    onPayload: (payload) => {
      recorder?.recordHostActionPayload(payload);
    },
  });

  if (fillStreamLive) {
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

  const llmMessages =
    contract.produceMode === 'structured'
      ? withStructuredArgsHint(input.messages, input.hostTool.definition.argsSchema)
      : input.messages;

  const startName = input.llmAudit?.startName ?? 'streamChat.start';
  const endName = input.llmAudit?.endName ?? 'streamChat.end';
  recorder?.recordLlm(startName, {
    messageCount: llmMessages.length,
    delivery: contract.delivery,
    produceMode: contract.produceMode,
    streamableTools: fillTools.map((tool) => tool.name),
    dslDispatch: willDispatchLive,
  });

  try {
    const llmFill = await runHostFillLlmStream({
      llmService: input.llmService,
      messages: llmMessages,
      textSession,
      signal: input.signal,
      budgetHints: input.budgetHints,
      onLlmDelta: (delta) => {
        input.onLlmDelta?.(delta);
      },
    });

    model = llmFill.model;
    fillText = llmFill.fillText;
    displayText = llmFill.fillText;
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
      delivery: contract.delivery,
      dslDispatch: willDispatchLive,
    });

    if (fillStreamLive && streamSession) {
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
            delivery: contract.delivery,
            rawAccumulatedLen: llmFill.rawAccumulatedLen,
            streamResultContentLen: llmFill.streamResult.content?.length ?? 0,
          },
        });
      }
    } else if (contract.delivery === 'instant') {
      // 结构化参数：优先用未 sanitize 的原文解析，避免填表 sanitize 破坏 JSON。
      const structuredSource =
        llmFill.rawAccumulatedText.trim() ||
        llmFill.streamResult.content?.trim() ||
        fillText;
      const args = parseHostToolArgsFromLlmText({
        text: structuredSource,
        argsSchema: input.hostTool.definition.argsSchema,
      });
      if (args) {
        const hostTools: HostActionHostToolInvocation[] = [
          { name: input.hostTool.definition.name, args },
        ];
        // 权威 JSON 供 DB 重放；displayText 供 lifecycle 展示。
        fillText = JSON.stringify(args);
        displayText = buildHostToolArgsDisplayText(args);
        dispatchHostActionInstant(publish, `page-action:${input.actionRunId}`, {
          pageContext: input.pageContext,
          runId: input.actionRunId,
          turnId: input.actionRunId,
          hostTools,
          reason: input.reason,
          streamId: input.streamId,
          generation: input.generation,
        });
        dslOutcome = 'dispatched';
        recorder?.record({
          type: 'dsl',
          name: 'instant.dispatched',
          status: 'ok',
          detail: {
            delivery: 'instant',
            tool: input.hostTool.definition.name,
            argKeys: Object.keys(args),
          },
        });
      } else {
        dslOutcome = 'failed';
        recorder?.record({
          type: 'dsl',
          name: 'instant.failed',
          status: 'failed',
          detail: {
            reason: 'structured_args_parse_or_validate_failed',
            delivery: 'instant',
            fillTextLen: structuredSource.length,
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
    displayText: displayText || fillText,
    dslOutcome,
    model,
    promptTokens,
    completionTokens,
    appendCount,
    streamable: contract.delivery === 'fill_stream',
    delivery: contract.delivery,
  };
}
