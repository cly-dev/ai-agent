import {
  buildPlanHostFillsFromMachineText,
  createPlanReasonHostFillStreamTextSession,
  runHostFillLlmStream,
} from '../agent-engine/engine/main/plan-present/plan-reason-host-machine-layer.util';
import { extractRoutedMessageFromLlmText } from '../agent-engine/engine/llm-stream-router.util';
import { dispatchHostActionInstant } from '../host-bridge/host-action-instant-dispatch.util';
import type { HostActionHostToolInvocation } from '../host-bridge/host-action.types';
import {
  buildHostToolArgsDisplayText,
  parseHostToolArgsFromLlmTextCandidates,
} from '../host-bridge/host-tool-args-from-llm.util';
import { sanitizeHostToolArgsAgainstContextCatalogs } from '../host-bridge/host-tool-args-context-catalog.util';
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
import {
  isLlmAbortError,
  produceHostToolArgsViaToolCall,
} from './page-action-structured-produce.util';
import {
  logPageActionLlmPrompt,
  logPageActionLlmResponse,
} from './page-action-run-debug.util';
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
  /** 实际 LLM 调用次数（tool_call 失败再 stream 兜底时为 2）。 */
  llmCallCount: number;
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

/**
 * tool_call 主路径：点名 bound host tool；格式由 API tool schema 约束。
 */
function withToolCallTaskMessages(
  messages: LlmChatMessage[],
  toolName: string,
): LlmChatMessage[] {
  const prefix =
    `Task: call host tool \`${toolName}\` exactly once with filled arguments. ` +
    'Follow the system business rules. Do not answer article Q&A; do not invent ids outside context.\n\n';
  return messages.map((message) => {
    if (message.role !== 'user') {
      return message;
    }
    return { role: 'user', content: `${prefix}${message.content}` };
  });
}

/** stream+parse 兜底：明确要求 JSON args（无 tool_call 协议时）。 */
function withJsonArgsFallbackMessages(
  messages: LlmChatMessage[],
  toolName: string,
): LlmChatMessage[] {
  const prefix =
    `Task: output only JSON arguments for host tool \`${toolName}\` (no markdown, no Q&A). ` +
    'Follow the system business rules; do not invent ids outside context.\n\n';
  return messages.map((message) => {
    if (message.role !== 'user') {
      return message;
    }
    return { role: 'user', content: `${prefix}${message.content}` };
  });
}

function resolveFallbackAuditStartName(startName: string): string {
  if (startName.endsWith('.start')) {
    return `${startName.slice(0, -'.start'.length)}.fallback.start`;
  }
  return `${startName}.fallback`;
}

function resolveFallbackAuditEndName(endName: string): string {
  if (endName.endsWith('.end')) {
    return `${endName.slice(0, -'.end'.length)}.fallback.end`;
  }
  return `${endName}.fallback`;
}

/** 多次 LLM 调用的 token 累加；两侧皆空则保持 null。 */
function addNullableTokenCounts(
  left: number | null,
  right: number | null,
): number | null {
  if (left == null && right == null) {
    return null;
  }
  return (left ?? 0) + (right ?? 0);
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

function dispatchInstantArgs(input: {
  publish: ReturnType<typeof createInlineHostActionPublisher>;
  actionRunId: number;
  pageContext: AgentChatPageContext | null;
  generation: number;
  streamId: string;
  reason: string;
  toolName: string;
  args: Record<string, unknown>;
}): void {
  dispatchHostActionInstant(input.publish, `page-action:${input.actionRunId}`, {
    pageContext: input.pageContext,
    runId: input.actionRunId,
    turnId: input.actionRunId,
    hostTools: [{ name: input.toolName, args: input.args }],
    reason: input.reason,
    streamId: input.streamId,
    generation: input.generation,
  });
}

/**
 * PageAction 共用：按 HostTool 交付契约 produce → dispatch。
 * - fill_stream：streamChat prose + arg.append
 * - instant：主路径 bindTools/tool_call；失败再 fallback stream+parse → tool.flush
 * - observation：仅 LLM，不发 host_action
 */
export async function executePageActionLlmDslStream(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  sseSink: PageActionSseSink;
  pageContext: AgentChatPageContext | null;
  /** PageAction invoke.context；供 x-contextIdCatalog 白名单 */
  actionContext?: Record<string, unknown> | null;
  actionRunId: number;
  /** 便于开发日志归档 */
  actionKey?: string | null;
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
  // produceMode structured = 非 prose 结构化 args；实现上用 native tool_call
  const useToolCallPrimary =
    contract.delivery === 'instant' && contract.produceMode === 'structured';
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
        toolCallPrimary: useToolCallPrimary,
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
  let llmCallCount = 0;
  let toolCallPrimaryFailed = false;
  /** tool_call 模型侧失败时才允许 stream+parse 兜底 */
  let allowStreamParseFallback = false;

  const publish = createInlineHostActionPublisher(input.sseSink, {
    onPayload: (payload) => {
      recorder?.recordHostActionPayload(payload);
    },
  });

  const startName = input.llmAudit?.startName ?? 'streamChat.start';
  const endName = input.llmAudit?.endName ?? 'streamChat.end';

  // —— instant 主路径：bindTools + tool_call ——
  if (useToolCallPrimary) {
    const toolName = input.hostTool.definition.name;
    const toolCallMessages = withToolCallTaskMessages(input.messages, toolName);
    recorder?.recordLlm(startName, {
      messageCount: toolCallMessages.length,
      delivery: contract.delivery,
      produceMode: 'structured',
      producePath: 'tool_call',
      streamableTools: [],
      dslDispatch: willDispatchLive,
      tool: toolName,
    });

    try {
      const produced = await produceHostToolArgsViaToolCall({
        llmService: input.llmService,
        messages: toolCallMessages,
        hostTool: input.hostTool.definition,
        actionContext: input.actionContext ?? null,
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        budgetHints: { callKind: 'decision' },
        signal: input.signal,
      });
      if (produced.llmInvoked) {
        llmCallCount += 1;
      }
      model = produced.model;
      promptTokens = produced.promptTokens;
      completionTokens = produced.completionTokens;

      // 本仓库 strictNullChecks=false，`!produced.ok` 无法收窄；必须用 === false
      if (produced.ok === false) {
        toolCallPrimaryFailed = true;
        allowStreamParseFallback = produced.retryWithStreamParse;
        recorder?.recordLlm(endName, {
          model,
          appendCount: 0,
          sessionFillTextLen: 0,
          producePath: 'tool_call',
          delivery: contract.delivery,
          dslDispatch: false,
          toolCallFailed: true,
          error: produced.error,
          retryWithStreamParse: produced.retryWithStreamParse,
          promptTokens,
          completionTokens,
        });
        recorder?.record({
          type: 'dsl',
          name: 'produce.tool_call_failed',
          status: 'failed',
          detail: {
            delivery: 'instant',
            error: produced.error,
            fallback: produced.retryWithStreamParse
              ? 'stream_parse'
              : 'none',
          },
        });

        // 本地 bind/协议失败：直接失败，不烧第二枪
        if (!produced.retryWithStreamParse) {
          return {
            fillText: '',
            displayText: '',
            dslOutcome: 'failed',
            model,
            promptTokens,
            completionTokens,
            appendCount: 0,
            llmCallCount,
            streamable: false,
            delivery: contract.delivery,
          };
        }
      } else {
        fillText = JSON.stringify(produced.args);
        displayText = buildHostToolArgsDisplayText(produced.args);
        input.onLlmDelta?.({ contentDelta: displayText, done: true });
        const droppedKeys = Object.keys(produced.droppedCatalogIds ?? {});
        recorder?.recordLlm(endName, {
          model,
          appendCount: 0,
          sessionFillTextLen: fillText.length,
          producePath: 'tool_call',
          delivery: contract.delivery,
          dslDispatch: true,
          promptTokens,
          completionTokens,
          ...(droppedKeys.length > 0
            ? { droppedCatalogIds: produced.droppedCatalogIds }
            : {}),
        });
        if (droppedKeys.length > 0) {
          recorder?.record({
            type: 'dsl',
            name: 'args.catalog_sanitized',
            status: 'ok',
            detail: {
              delivery: 'instant',
              droppedCatalogIds: produced.droppedCatalogIds,
            },
          });
        }
        dispatchInstantArgs({
          publish,
          actionRunId: input.actionRunId,
          pageContext: input.pageContext,
          generation: input.generation,
          streamId: input.streamId,
          reason: input.reason,
          toolName,
          args: produced.args,
        });
        dslOutcome = 'dispatched';
        recorder?.record({
          type: 'dsl',
          name: 'instant.dispatched',
          status: 'ok',
          detail: {
            delivery: 'instant',
            producePath: 'tool_call',
            tool: toolName,
            argKeys: Object.keys(produced.args),
          },
        });
        return {
          fillText,
          displayText: displayText || fillText,
          dslOutcome,
          model,
          promptTokens,
          completionTokens,
          appendCount: 0,
          llmCallCount,
          streamable: false,
          delivery: contract.delivery,
        };
      }
    } catch (error) {
      if (isLlmAbortError(error, input.signal)) {
        throw error;
      }
      toolCallPrimaryFailed = true;
      allowStreamParseFallback = true;
      // produce 已吞非 abort；此处仅兜底未计入的异常
      if (llmCallCount === 0) {
        llmCallCount += 1;
      }
      const message = error instanceof Error ? error.message : String(error);
      recorder?.recordLlm(endName, {
        model,
        appendCount: 0,
        sessionFillTextLen: 0,
        producePath: 'tool_call',
        delivery: contract.delivery,
        dslDispatch: false,
        toolCallFailed: true,
        error: message,
        retryWithStreamParse: true,
        promptTokens,
        completionTokens,
      });
      recorder?.record({
        type: 'dsl',
        name: 'produce.tool_call_failed',
        status: 'failed',
        detail: {
          delivery: 'instant',
          error: message,
          fallback: 'stream_parse',
        },
      });
    }
  }

  // abort 后禁止再开 stream 兜底
  if (input.signal?.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  // tool_call 本地失败已 early-return；此处仅 fill_stream / observation / 允许的 fallback
  const isStreamParseFallback = toolCallPrimaryFailed && allowStreamParseFallback;

  // —— fill_stream / observation / tool_call fallback：streamChat ——
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

  const llmMessages = isStreamParseFallback
    ? withJsonArgsFallbackMessages(
        input.messages,
        input.hostTool.definition.name,
      )
    : input.messages;

  const streamStartName = isStreamParseFallback
    ? resolveFallbackAuditStartName(startName)
    : startName;
  const streamEndName = isStreamParseFallback
    ? resolveFallbackAuditEndName(endName)
    : endName;

  recorder?.recordLlm(streamStartName, {
    messageCount: llmMessages.length,
    delivery: contract.delivery,
    produceMode: contract.produceMode,
    producePath: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
    streamableTools: fillTools.map((tool) => tool.name),
    dslDispatch: willDispatchLive,
  });

  logPageActionLlmPrompt({
    actionRunId: input.actionRunId,
    actionKey: input.actionKey,
    phase: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
    messages: llmMessages,
    meta: {
      delivery: contract.delivery,
      produceMode: contract.produceMode,
      willDispatchLive,
      fillStreamLive,
    },
  });

  try {
    const llmFill = await runHostFillLlmStream({
      llmService: input.llmService,
      messages: llmMessages,
      textSession,
      signal: input.signal,
      // tool_call 主路径用 decision；fill_stream / stream 兜底用 summarize（或调用方传入）
      budgetHints: isStreamParseFallback
        ? { callKind: 'summarize' }
        : (input.budgetHints ?? { callKind: 'summarize' }),
      onLlmDelta: (delta) => {
        input.onLlmDelta?.(delta);
      },
    });
    llmCallCount += 1;

    model = llmFill.model ?? model;
    fillText = llmFill.fillText;
    displayText = llmFill.fillText;
    appendCount = llmFill.appendCount;
    const responseMeta = responseMetaFromStreamRaw(llmFill.streamResult.raw);
    const usage = extractLlmTokenUsageFromResponseMeta(responseMeta);
    // 兜底时累加，避免只保留第二枪的用量
    promptTokens = addNullableTokenCounts(
      promptTokens,
      usage?.promptTokens ?? null,
    );
    completionTokens = addNullableTokenCounts(
      completionTokens,
      usage?.completionTokens ?? null,
    );
    if (!model) {
      model = resolveLlmModelNameFromResponseMeta(responseMeta);
    }

    logPageActionLlmResponse({
      actionRunId: input.actionRunId,
      actionKey: input.actionKey,
      phase: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
      model,
      promptTokens,
      completionTokens,
      detail: {
        appendCount,
        fillText,
        rawAccumulatedText: llmFill.rawAccumulatedText,
        streamResultContent: llmFill.streamResult.content ?? null,
        fellBackToInvoke:
          llmFill.streamResult.streamMeta?.fellBackToInvoke ?? false,
      },
    });

    recorder?.recordLlm(streamEndName, {
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
      producePath: isStreamParseFallback ? 'stream_parse_fallback' : 'stream',
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
      const routedFromFull = extractRoutedMessageFromLlmText(
        llmFill.streamResult.content ?? '',
      );
      const parsed = parseHostToolArgsFromLlmTextCandidates({
        candidates: [
          llmFill.rawAccumulatedText,
          routedFromFull,
          fillText,
          llmFill.streamResult.content,
        ],
        argsSchema: input.hostTool.definition.argsSchema,
      });
      if (parsed.ok) {
        const sanitized = sanitizeHostToolArgsAgainstContextCatalogs(
          parsed.args,
          input.hostTool.definition.argsSchema,
          input.actionContext ?? null,
        );
        fillText = JSON.stringify(sanitized.args);
        displayText = buildHostToolArgsDisplayText(sanitized.args);
        if (Object.keys(sanitized.droppedByField).length > 0) {
          recorder?.record({
            type: 'dsl',
            name: 'args.catalog_sanitized',
            status: 'ok',
            detail: {
              delivery: 'instant',
              producePath: isStreamParseFallback
                ? 'stream_parse_fallback'
                : 'stream_parse',
              droppedCatalogIds: sanitized.droppedByField,
            },
          });
        }
        dispatchInstantArgs({
          publish,
          actionRunId: input.actionRunId,
          pageContext: input.pageContext,
          generation: input.generation,
          streamId: input.streamId,
          reason: input.reason,
          toolName: input.hostTool.definition.name,
          args: sanitized.args,
        });
        dslOutcome = 'dispatched';
        recorder?.record({
          type: 'dsl',
          name: 'instant.dispatched',
          status: 'ok',
          detail: {
            delivery: 'instant',
            producePath: isStreamParseFallback
              ? 'stream_parse_fallback'
              : 'stream_parse',
            tool: input.hostTool.definition.name,
            argKeys: Object.keys(sanitized.args),
          },
        });
      } else {
        dslOutcome = 'failed';
        const failReason =
          parsed.ok === false ? parsed.reason : 'parse_failed';
        const failPreview = parsed.ok === false ? parsed.preview : '';
        recorder?.record({
          type: 'dsl',
          name: 'instant.failed',
          status: 'failed',
          detail: {
            reason: failReason,
            delivery: 'instant',
            preview: failPreview,
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
    displayText: displayText || fillText,
    dslOutcome,
    model,
    promptTokens,
    completionTokens,
    appendCount,
    llmCallCount,
    streamable: contract.delivery === 'fill_stream',
    delivery: contract.delivery,
  };
}
