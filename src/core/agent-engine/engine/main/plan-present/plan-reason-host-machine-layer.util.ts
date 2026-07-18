import {
  sanitizeLlmFinalOutput,
  sanitizeTextForStorage,
} from '../../llm-output-sanitize.util';
import {
  createLlmStreamRouterState,
  extractRoutedMessageFromLlmText,
  routeLlmStreamChunk,
} from '../../llm-stream-router.util';
import type { LlmService } from '../../../../llm/llm.service';
import type { LlmChatMessage, LlmChatResult } from '../../../../llm/llm.types';
import type { PromptBudgetHints } from '../../../../llm/prompt-budget/prompt-budget.types';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { HostActionHostToolInvocation } from '../../../../host-bridge/host-action.types';
import { buildHostToolStreamObservation } from '../../../../host-bridge/host-tool-stream-observation.util';
import { HostToolStreamSession } from '../../../../host-bridge/host-tool-stream-session.util';
import {
  primaryHostToolStreamTool,
  resolvePlanReasonHostFillTools,
  resolvePlanReasonHostStreamDelivery,
  type HostToolStreamTarget,
  type HostToolStreamToolTarget,
  type PlanReasonHostStreamDelivery,
} from '../../../../host-bridge/host-tool-stream-target.util';
import type { AgentChatPageContext } from '../../../../host-bridge/page-context.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
import type { AgentRunSseGateway } from '../../../../session-run/agent-run-sse.gateway';
import type { ToolObservation } from '../types/agent-engine.types';
import { emitLlmPromptDebug } from '../../llm-prompt-debug.util';
import { buildHostToolDispatchObservations } from '../host-tool/host-tool-plan.util';
import type { PlanHostFillEntry } from './plan-host-fill.util';
import {
  buildPlanReasonHostFillUserContent,
  buildPlanReasonHostMachineStreamMessages,
} from './plan-reason-host-machine-prompt.util';

export type PlanReasonHostMachineLayerContext = {
  agentPrompts: LlmChatMessage[];
  userContext: string;
  allowedToolNames: Set<string>;
  hostTools: HostToolDecisionDefinition[];
  pageContext: AgentChatPageContext | null | undefined;
  sessionId: string;
  runId: number;
  turnId: number;
  scope: { appClientId: number; agentId: number };
  /** 即将 dispatch 的 host_tool plan step（与 DSL / finalize 同源）。 */
  hostStepId: string;
  reasonStepId: string | null;
};

type PlanReasonHostDslContext = PlanReasonHostMachineLayerContext & {
  pageContext: AgentChatPageContext;
};

export type PlanReasonHostMachineLayerDeps = {
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  runSseGateway: Pick<
    AgentRunSseGateway,
    | 'emitHostAction'
    | 'getBoundRunGeneration'
    | 'canPublishRun'
    | 'getRunAbortSignal'
  >;
  logger: { warn: (message: string) => void; log: (message: string) => void };
};

export type PlanReasonHostMachineLayerResult = {
  fills: PlanHostFillEntry[];
  delivery: PlanReasonHostStreamDelivery['mode'];
  dslOutcome?: 'dispatched' | 'failed';
  hostToolStreamObservation?: ToolObservation;
  hostToolDispatchObservations?: ToolObservation[];
};

/** 机器层填表正文 sanitize（stream append / full / plan_host_fill 同源）。 */
export function sanitizeMachineFillText(raw: string): string {
  let text = raw.trim();
  if (!text) {
    return '';
  }
  const fenced = text.match(/^```(?:text)?\s*([\s\S]*?)```$/i);
  if (fenced?.[1]) {
    text = fenced[1].trim();
  }
  return sanitizeLlmFinalOutput(sanitizeTextForStorage(text)).trim();
}

function nextSanitizedMachineFillDelta(
  rawSnapshot: string,
  previouslyEmitted: string,
): { delta: string; emitted: string } {
  const sanitized = sanitizeMachineFillText(rawSnapshot);
  if (!sanitized) {
    return { delta: '', emitted: previouslyEmitted };
  }
  if (sanitized.startsWith(previouslyEmitted)) {
    return {
      delta: sanitized.slice(previouslyEmitted.length),
      emitted: sanitized,
    };
  }
  return { delta: '', emitted: previouslyEmitted };
}

export function buildPlanHostFillsFromMachineText(input: {
  text: string;
  fillTools: HostToolStreamToolTarget[];
  allowedToolNames: Set<string>;
}): PlanHostFillEntry[] {
  const fillText = sanitizeMachineFillText(input.text);
  if (!fillText) {
    return [];
  }
  const fills: PlanHostFillEntry[] = [];
  for (const tool of input.fillTools) {
    if (!input.allowedToolNames.has(tool.name)) {
      continue;
    }
    fills.push({
      tool: tool.name,
      arguments: {
        [tool.streamablePath]: fillText,
      },
    });
  }
  return fills;
}

type PlanReasonHostFillStreamTextSession = {
  ingestLlmDelta: (delta: string) => void;
  reconcileStreamResult: (fullContent: string) => boolean;
  resolveFillText: () => string;
  getRawAccumulatedLength: () => number;
  getRawAccumulatedText: () => string;
  readonly appendCount: number;
  readonly routedMessageChars: number;
};

export function createPlanReasonHostFillStreamTextSession(callbacks: {
  onSanitizedDelta?: (delta: string) => void;
}): PlanReasonHostFillStreamTextSession {
  let accumulatedRaw = '';
  let sanitizedEmitted = '';
  let appendCount = 0;
  let routedMessageChars = 0;
  let routerState = createLlmStreamRouterState();

  const ingestRoutedMessage = (messageDelta: string) => {
    if (!messageDelta) {
      return;
    }
    routedMessageChars += messageDelta.length;
    accumulatedRaw += messageDelta;
    const next = nextSanitizedMachineFillDelta(
      accumulatedRaw,
      sanitizedEmitted,
    );
    sanitizedEmitted = next.emitted;
    if (!next.delta) {
      return;
    }
    appendCount += 1;
    callbacks.onSanitizedDelta?.(next.delta);
  };

  return {
    ingestLlmDelta(delta: string) {
      if (!delta) {
        return;
      }
      const routed = routeLlmStreamChunk(routerState, delta);
      routerState = routed.state;
      ingestRoutedMessage(routed.message);
    },
    reconcileStreamResult(fullContent: string) {
      const trimmed = fullContent.trim();
      if (!trimmed || accumulatedRaw.trim()) {
        return false;
      }
      const message = extractRoutedMessageFromLlmText(trimmed);
      if (!message.trim()) {
        return false;
      }
      ingestRoutedMessage(message);
      return true;
    },
    resolveFillText() {
      return sanitizeMachineFillText(accumulatedRaw) || sanitizedEmitted;
    },
    getRawAccumulatedLength() {
      return accumulatedRaw.length;
    },
    getRawAccumulatedText() {
      return accumulatedRaw;
    },
    get appendCount() {
      return appendCount;
    },
    get routedMessageChars() {
      return routedMessageChars;
    },
  };
}

export type HostFillLlmStreamResult = {
  model: string | null;
  streamResult: LlmChatResult;
  fillText: string;
  appendCount: number;
  routedMessageChars: number;
  rawAccumulatedLen: number;
  rawAccumulatedText: string;
  reconciledFromStreamResult: boolean;
};

/** Chat plan-host 与 PageAction 共用的 LLM 填表流（think/message 路由 + sanitize + 终态 reconcile）。 */
export async function runHostFillLlmStream(input: {
  llmService: LlmService;
  messages: LlmChatMessage[];
  textSession: PlanReasonHostFillStreamTextSession;
  signal?: AbortSignal;
  budgetHints?: PromptBudgetHints;
  onLlmDelta?: (delta: { contentDelta: string; model?: string; done?: boolean }) => void;
}): Promise<HostFillLlmStreamResult> {
  let model: string | null = null;
  const streamResult = await input.llmService.streamChat(
    {
      messages: input.messages,
      tools: [],
      signal: input.signal,
      ...(input.budgetHints ? { budgetHints: input.budgetHints } : {}),
    },
    {
      signal: input.signal,
      onDelta: (delta) => {
        input.onLlmDelta?.({
          contentDelta: delta.contentDelta,
          model: delta.model,
          done: delta.done,
        });
        // host fill 只吃 content 通道；reasoningDelta 丢弃，避免思考进 fillText
        if (delta.contentDelta) {
          input.textSession.ingestLlmDelta(delta.contentDelta);
        }
        if (delta.model) {
          model = delta.model;
        }
      },
    },
  );
  if (streamResult.model) {
    model = streamResult.model;
  }
  const reconciledFromStreamResult = input.textSession.reconcileStreamResult(
    streamResult.content,
  );
  const fillText = input.textSession.resolveFillText();
  return {
    model,
    streamResult,
    fillText,
    appendCount: input.textSession.appendCount,
    routedMessageChars: input.textSession.routedMessageChars,
    rawAccumulatedLen: input.textSession.getRawAccumulatedLength(),
    rawAccumulatedText: input.textSession.getRawAccumulatedText(),
    reconciledFromStreamResult,
  };
}

function toHostToolInvocations(
  fills: PlanHostFillEntry[],
): HostActionHostToolInvocation[] {
  return fills.map((fill) => ({
    name: fill.tool,
    args: fill.arguments,
  }));
}

function toDslContext(
  context: PlanReasonHostMachineLayerContext,
): PlanReasonHostDslContext {
  return { ...context, pageContext: context.pageContext ?? {} };
}

function resolveDelivery(
  deps: PlanReasonHostMachineLayerDeps,
  context: PlanReasonHostMachineLayerContext,
  fillTools: HostToolStreamToolTarget[],
): PlanReasonHostStreamDelivery {
  return resolvePlanReasonHostStreamDelivery({
    hostStepId: context.hostStepId,
    fillTools,
    runId: context.runId,
    turnId: context.turnId,
    reasonStepId: context.reasonStepId,
    canPublishRun: deps.runSseGateway.canPublishRun(
      context.sessionId,
      context.runId,
    ),
  });
}

async function runMachineStreamLlm(input: {
  deps: PlanReasonHostMachineLayerDeps;
  context: PlanReasonHostMachineLayerContext;
  textSession: PlanReasonHostFillStreamTextSession;
  signal?: AbortSignal;
}): Promise<'completed' | 'failed'> {
  const messages = await buildPlanReasonHostMachineStreamMessages({
    agentPrompts: input.context.agentPrompts,
    promptRegistry: input.deps.promptRegistry,
    scope: input.context.scope,
    userContext: input.context.userContext,
  });

  emitLlmPromptDebug((message) => input.deps.logger.log(message), {
    runId: input.context.runId,
    sessionId: input.context.sessionId,
    phase: 'summarize',
    messages,
    meta: { planReasonHostFillStream: true },
  });

  try {
    const llmResult = await runHostFillLlmStream({
      llmService: input.deps.llmService,
      messages,
      textSession: input.textSession,
      signal: input.signal,
      budgetHints: {
        callKind: 'summarize',
        sessionId: input.context.sessionId,
        runId: input.context.runId,
        phase: 'summarize',
      },
    });
    void llmResult;
    return 'completed';
  } catch (error) {
    input.deps.logger.warn(
      `plan reason host fill stream llm failed: ${
        error instanceof Error ? error.message : String(error)
      } runId=${input.context.runId}`,
    );
    return 'failed';
  }
}

function createHostToolStreamSession(
  deps: PlanReasonHostMachineLayerDeps,
  context: PlanReasonHostDslContext,
  streamTarget: HostToolStreamTarget,
): HostToolStreamSession {
  const generation =
    deps.runSseGateway.getBoundRunGeneration(
      context.sessionId,
      context.runId,
    ) ?? undefined;
  return new HostToolStreamSession({
    publish: (sid, envelope) => {
      deps.runSseGateway.emitHostAction(sid, context.runId, envelope.payload);
    },
    sessionId: context.sessionId,
    pageContext: context.pageContext,
    runId: context.runId,
    turnId: context.turnId,
    hostStepId: streamTarget.hostStepId,
    reason: streamTarget.reason,
    generation,
  });
}

function buildStreamObservation(input: {
  outcome: 'dispatched' | 'failed';
  streamTarget: HostToolStreamTarget;
  hostTools: HostActionHostToolInvocation[];
}): ToolObservation {
  const primary = primaryHostToolStreamTool(input.streamTarget);
  return buildHostToolStreamObservation({
    outcome: input.outcome,
    hostStepId: input.streamTarget.hostStepId,
    streamId: input.streamTarget.streamId,
    hostTools: input.hostTools,
    streamablePath: primary.streamablePath,
  });
}

async function produceMachineLayerFills(input: {
  deps: PlanReasonHostMachineLayerDeps;
  context: PlanReasonHostMachineLayerContext;
  fillTools: HostToolStreamToolTarget[];
  onSanitizedDelta?: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<{
  fills: PlanHostFillEntry[];
  llmStatus: 'completed' | 'failed';
  appendCount: number;
}> {
  const textSession = createPlanReasonHostFillStreamTextSession({
    onSanitizedDelta: input.onSanitizedDelta,
  });
  const llmStatus = await runMachineStreamLlm({
    deps: input.deps,
    context: input.context,
    textSession,
    signal: input.signal,
  });
  const fills = buildPlanHostFillsFromMachineText({
    text: textSession.resolveFillText(),
    fillTools: input.fillTools,
    allowedToolNames: input.context.allowedToolNames,
  });
  return {
    fills,
    llmStatus,
    appendCount: textSession.appendCount,
  };
}

async function runPlanReasonHostMachineLayerStream(
  deps: PlanReasonHostMachineLayerDeps,
  context: PlanReasonHostMachineLayerContext,
  streamTarget: HostToolStreamTarget,
): Promise<PlanReasonHostMachineLayerResult> {
  const dslContext = toDslContext(context);
  const abortSignal =
    deps.runSseGateway.getRunAbortSignal(context.sessionId, context.runId) ??
    undefined;
  const streamSession = createHostToolStreamSession(
    deps,
    dslContext,
    streamTarget,
  );

  streamSession.begin({
    streamId: streamTarget.streamId,
    tools: streamTarget.tools,
    reason: streamTarget.reason,
  });

  const produced = await produceMachineLayerFills({
    deps,
    context,
    fillTools: streamTarget.tools,
    onSanitizedDelta: (delta) => streamSession.appendFillChunk(delta),
    signal: abortSignal,
  });

  if (produced.fills.length > 0) {
    const hostToolsPayload = toHostToolInvocations(produced.fills);
    streamSession.finalize({
      hostTools: hostToolsPayload,
      reason: streamTarget.reason,
    });
    deps.logger.log(
      `plan reason host fill stream finalized runId=${context.runId} streamId=${streamTarget.streamId} tools=${hostToolsPayload.map((row) => row.name).join(',')}`,
    );
    return {
      fills: produced.fills,
      delivery: 'stream',
      dslOutcome: 'dispatched',
      hostToolStreamObservation: buildStreamObservation({
        outcome: 'dispatched',
        streamTarget,
        hostTools: hostToolsPayload,
      }),
      hostToolDispatchObservations: buildHostToolDispatchObservations({
        hostCalls: hostToolsPayload.map((row) => ({
          name: row.name,
          arguments: row.args,
        })),
        planStepId: streamTarget.hostStepId,
      }),
    };
  }

  streamSession.abort({ emitSessionEnd: streamSession.hasBegun });
  deps.logger.warn(
    `plan reason host fill stream failed runId=${context.runId} streamId=${streamTarget.streamId} llm=${produced.llmStatus} appends=${produced.appendCount}`,
  );
  return {
    fills: [],
    delivery: 'stream',
    dslOutcome: 'failed',
    hostToolStreamObservation: buildStreamObservation({
      outcome: 'failed',
      streamTarget,
      hostTools: [],
    }),
  };
}

/** 无 SSE：仅 stream LLM + plan_host_fill。 */
async function runPlanReasonHostMachineLayerObservation(
  deps: PlanReasonHostMachineLayerDeps,
  context: PlanReasonHostMachineLayerContext,
  fillTools: HostToolStreamToolTarget[],
): Promise<PlanReasonHostMachineLayerResult> {
  const abortSignal =
    deps.runSseGateway.getRunAbortSignal(context.sessionId, context.runId) ??
    undefined;
  const produced = await produceMachineLayerFills({
    deps,
    context,
    fillTools,
    signal: abortSignal,
  });
  if (produced.fills.length === 0) {
    deps.logger.warn(
      `plan reason host fill observation-only empty runId=${context.runId} llm=${produced.llmStatus}`,
    );
  }
  return {
    fills: produced.fills,
    delivery: 'observation',
  };
}

/**
 * reason 机器层：始终 stream LLM；能 fill_stream 则 DSL append，否则 observation。
 * 结构化 instant HostTool 不走本层 prose fill（由 tool-call / PageAction instant 交付）。
 */
export async function runPlanReasonHostMachineLayer(
  deps: PlanReasonHostMachineLayerDeps,
  context: PlanReasonHostMachineLayerContext,
): Promise<PlanReasonHostMachineLayerResult> {
  const fillTools = resolvePlanReasonHostFillTools({
    hostTools: context.hostTools,
    allowedToolNames: context.allowedToolNames,
  });
  if (fillTools.length === 0) {
    deps.logger.warn(
      `plan reason host fill skipped: no fill_stream host tools (structured tools use instant dispatch elsewhere) runId=${context.runId}`,
    );
    return { fills: [], delivery: 'observation' };
  }

  const delivery = resolveDelivery(deps, context, fillTools);
  if (delivery.mode === 'stream') {
    return runPlanReasonHostMachineLayerStream(
      deps,
      context,
      delivery.target,
    );
  }

  deps.logger.warn(
    `plan reason host fill using observation-only (no DSL stream) runId=${context.runId} hostStepId=${context.hostStepId} fillTools=${fillTools.map((tool) => tool.name).join(',')}`,
  );
  return runPlanReasonHostMachineLayerObservation(deps, context, fillTools);
}

export function buildPlanReasonHostMachineContext(input: {
  agentPrompts: LlmChatMessage[];
  userMessage: string;
  planContext: string | null;
  hostTools: HostToolDecisionDefinition[];
  splitObservationsText: string | null;
  serializedOutput: string;
  allowedToolNames: Set<string>;
  pageContext: AgentChatPageContext | null | undefined;
  sessionId: string;
  runId: number;
  turnId: number;
  scope: { appClientId: number; agentId: number };
  hostStepId: string;
  reasonStepId: string | null;
}): PlanReasonHostMachineLayerContext {
  return {
    agentPrompts: input.agentPrompts,
    userContext: buildPlanReasonHostFillUserContent({
      userMessage: input.userMessage,
      planContext: input.planContext,
      pageContext: input.pageContext,
      hostTools: input.hostTools,
      splitObservationsText: input.splitObservationsText,
      serializedOutput: input.serializedOutput,
    }),
    allowedToolNames: input.allowedToolNames,
    hostTools: input.hostTools,
    pageContext: input.pageContext,
    sessionId: input.sessionId,
    runId: input.runId,
    turnId: input.turnId,
    scope: input.scope,
    hostStepId: input.hostStepId,
    reasonStepId: input.reasonStepId,
  };
}
