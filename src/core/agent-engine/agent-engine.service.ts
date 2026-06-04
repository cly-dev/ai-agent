import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { z } from 'zod';
import {
  AgentRunRole,
  AgentRunStatus,
  ToolLevel,
} from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { normalizeToolCallArgs } from '../llm/tool-call-args.util';
import { LlmService } from '../llm/llm.service';
import type { LlmChatMessage } from '../llm/llm.types';
import {
  extractAgentPromptMessages,
  extractWorkingMemoryMessages,
  joinAgentPromptText,
} from './prompt-message.util';
import {
  dedupeObservationPayloads,
  formatObservationForLlm,
  isSameObservationPayload,
  serializeObservationsBlock,
  type LlmObservationPayload,
} from './observation-format.util';
import { estimateMessagesTokens } from '../llm/message-token-budget.util';
import { summarizeToolsForLlmSchema } from './tool/tool-schema-compact.util';
import { PromptComposerService } from '../prompt/prompt-composer.service';
import {
  ToolEngineService,
} from '../tool-engine/tool-engine.service';
import type {
  BuiltLangChainTools,
  ToolBuildContext,
  ToolExecutionDefinition,
} from '../tool-engine/tool-engine.service';
import type { ToolExecutionResult } from '../tool-engine/tool-engine.types';
import {
  classifySummarizeScenario,
  isLikelyReadOnlyQuestion,
  isUserRequestingFullDetail,
} from './user-response-style.util';
import { filterToolsByAgentMetadata, parseAgentMetadata } from '../tool-engine/tool-agent-metadata.util';
import { PROMPT_KEYS } from '../prompt/prompt-template.keys';
import { PromptRegistryService } from '../prompt/prompt-registry.service';
import {
  formatFieldLabelsForPrompt,
  parseResponseProfile,
  projectToolOutput,
} from '../tool-engine/tool-output-projection.util';
import type { ProjectedToolOutput } from '../tool-engine/tool-response-profile.types';
import type { ToolResponseProfile } from '../tool-engine/tool-response-profile.types';
import {
  buildLlmFailureUserMessage,
  buildToolErrorObservation,
  buildToolFailureUserMessage,
  extractToolErrorCode,
  extractToolErrorUserHint,
  isAgentToolErrorObservation,
  resolveAgentRunFailureCode,
  resolveLlmFailureCode,
  resolveAgentRunFailureUserMessage,
} from './agent-run-user-messages.util';
import type { AgentMachineCode } from './agent-run-user-messages.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatEventsService } from '../../modules/chat/chat-events.service';
import { SessionPrepareStore } from '../../modules/chat/session-prepare.store';
import { PendingWriteConfirmationStore } from '../../modules/chat/pending-write-confirmation.store';
import {
  buildWriteConfirmationUserMessage,
  collectWriteConfirmationRequired,
} from './write-confirmation-gate.util';
import { AgentService } from '../../modules/agent/agent.service';
import { SessionHistoryCompressionService } from '../memory/session-history-compression.service';
import type { WorkingMemoryState } from '../memory/session-context.types';
import { WorkingMemoryUpdateContext } from '../memory/session-context.types';
import { WorkingMemoryService } from '../memory/working-memory.service';
import { CategoryIntentRecallService } from '../intent/category-intent-recall.service';
import {
  createRunMetricsAccumulator,
  recordLlmUsage,
  recordMachineCodeUsage,
  recordToolUsage,
  resolveFinishReason,
  snapshotRunMetrics,
} from './run-metrics.util';
import type { RunMetricsAccumulator } from './run-metrics.util';
import type { MessageBlock, MessageBlockPatch } from './message/message-blocks.types';
import {
  buildRuleBasedMessageBlocks,
  ensureAtLeastOneTextBlock,
  filterLlmBlocksAvoidDuplicatingRule,
  isStructuredMessageBlock,
  looksLikeBlocksJsonOutput,
  mergeMessageBlocks,
  messageBlocksToPlainText,
  normalizeMessageBlocks,
  planStructuredBlockStreaming,
  serializeMessageBlocksForStorage,
  shouldBufferSummarizeLlmStream,
  stripMarkdownFenceForBlocksParse,
  textBlock,
  tryParseStoredMessageBlocks,
} from './message/message-blocks.util';
import {
  isEmptyListToolObservation,
  observationsAreOnlyEmptyLists,
  shouldPreferSummarizeOverObservedTools,
} from './tool/tool-observation.util';
import {
  areToolCallRoundsIdentical,
  getLastToolRoundFromSteps,
} from './tool/tool-call-dedupe.util';
import { detectIntentKind as classifyIntentKind } from './intent-kind.util';
import { loadSmallTalkHints } from '../intent/smalltalk-hints.util';
import {
  buildIntentClarificationGuidance,
  isUserIntentClear as isUserIntentMessageClear,
} from '../intent/intent-scope.util';
import { IntentScopeService } from '../intent/intent-scope.service';
import {
  emitLlmPromptDebug,
  isLlmPromptDebugEnabled,
} from './llm-prompt-debug.util';

type AgentRunInput = {
  userId: number;
  sessionId: string;
  input: string;
  /** 触发本轮的 user Message.id */
  userMessageId: number;
  /** 为 true 时尝试执行上一轮缓存的待确认写操作 Tool */
  confirmWrite?: boolean;
};

type AgentRunStepType = 'precheck' | 'intent' | 'llm' | 'tool' | 'summarize';
type PrecheckReasonCode =
  | 'HISTORY_SUFFICIENT'
  | 'HISTORY_INSUFFICIENT'
  | 'PRECHECK_PARSE_FAILED'
  | 'PRECHECK_LLM_FAILED';
const precheckDecisionSchema = z.object({
  answerableFromObservation: z.boolean(),
  reason: z.string().optional().nullable(),
});
type AgentRunStep = {
  step: number;
  type: AgentRunStepType;
  name?: string;
  input?: Record<string, unknown> | string;
  output?: Record<string, unknown> | string;
  meta?: {
    prompt?: string;
    agentPrompt?: string;
    userRequest?: string;
    model?: string;
    latency?: number;
    quality?: 'high' | 'medium' | 'low';
    code?: AgentMachineCode | PrecheckReasonCode;
  };
};

/** 运行期 scoped 工具：含 HTTP 执行字段与 responseProfile，全程存于 graph state。 */
type AgentEngineTool = ToolExecutionDefinition & {
  toolCategoryId: number | null;
  riskLevel: ToolLevel;
  responseProfile: unknown;
  agentMetadata: unknown;
};

type ParsedIntentPayload = {
  intentClear: boolean;
  guidance: string;
  matchedCategoryIds: number[];
  /** 意图明确且需要「未归类」工具时置 true（对应 toolCategoryId 为空的工具）。 */
  includeUncategorized: boolean;
};

type AgentRunResult = {
  runId: number;
  turnId: number;
  output: string;
  status: AgentRunStatus;
};

type ScopedToolsResult = {
  scopedTools: AgentEngineTool[];
  scopedLangChainTools: DynamicStructuredTool[];
  scopedToolBundle: BuiltLangChainTools;
  scopedAllowedToolIds: number[];
  bindCap?: Record<string, unknown>;
  fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
};

type CachedScopedToolsEntry = ScopedToolsResult & {
  toolFingerprint: string;
  expiresAt: number;
};

const SESSION_TOOL_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_SESSION_TOOL_CACHE_ENTRIES = 256;
/** 可用工具数低于此值时跳过 intent 召回，直接 bind 全量 scoped tools。 */
const INTENT_FULL_BIND_TOOL_THRESHOLD = 20;

type GraphToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

type ToolObservation = {
  name: string;
  output: unknown;
  /** LLM-oriented observation (flat records); built at tool execution time. */
  llmPayload?: LlmObservationPayload;
  quality?: 'high' | 'medium' | 'low';
  fieldLabels?: Record<string, string>;
  fieldDescriptions?: Record<string, string>;
  enumLabelsByPath?: Record<string, Record<string, string>>;
};

type AgentGraphState = {
  /** 当前已完成的 llm 轮次计数（每次进入 llm 节点 +1）。 */
  iteration: number;
  /** 执行轨迹（intent/llm/tool），用于持久化 AgentRun.steps。 */
  steps: AgentRunStep[];
  /** 已执行工具的观测结果，供后续 llm 决策参考。 */
  toolObservations: ToolObservation[];
  /** llm 产生但尚未执行的工具调用队列。 */
  pendingToolCalls: GraphToolCall[];
  /** tools 节点后待总结的观测结果。 */
  pendingSummaryObservation: ToolObservation | null;
  /** 意图层判定：task/smalltalk/unclear。 */
  intentKind: 'task' | 'smalltalk' | 'unclear';
  /** 最终输出文本（成功结束时写入 AgentRun.output）。 */
  finalOutput: string;
  /** 当前运行状态（running/success/failed）。 */
  status: AgentRunStatus;
  /** 是否提前结束图执行（true 时路由到 END）。 */
  finished: boolean;
  /** 意图识别后可见的工具集合（已按分类与权限收窄）。 */
  scopedTools: AgentEngineTool[];
  /** 与 scopedTools 对应的 LangChain tool（用于 bindTools / invoke）。 */
  scopedLangChainTools: DynamicStructuredTool[];
  /** 与 scopedTools 对应的可执行 toolId 白名单（执行阶段二次校验）。 */
  scopedAllowedToolIds: number[];
  /** 与 scopedTools 对应的 LangChain bundle（invoke 复用，避免重复 build + 查 Tool 表）。 */
  scopedToolBundle: BuiltLangChainTools | null;
  /** toolName -> responseProfile，启动时解析后写入 state。 */
  toolProfilesByName: Record<string, ToolResponseProfile | null>;
  /** 首轮低质量结果时仅允许一次“放宽工具集”重试。 */
  hasExpandedOnce: boolean;
  /** 写操作 Tool 待用户确认，图提前结束。 */
  awaitingWriteConfirmation?: boolean;
};

@Injectable()
export class AgentEngineService {
  private readonly logger = new Logger(AgentEngineService.name);
  /** SSE think 为 run 内累积全文；key = sessionId:runId */
  private readonly thinkBuffers = new Map<string, string>();
  /** SSE result 流式序号；key = sessionId:runId */
  private readonly streamSeq = new Map<string, number>();
  /** 本 run 已推送过 message 流式增量（key = sessionId:runId） */
  private readonly messageStreamDeltaEmitted = new Set<string>();
  /** 本 run 正文已通过 SSE 交付，run() 末尾无需再补 stream full */
  private readonly runSseContentDelivered = new Set<string>();
  private readonly sessionAllowedToolsCache = new Map<
    string,
    { tools: Awaited<ReturnType<AgentService['getAllowedTools']>>; expiresAt: number }
  >();
  /** sessionId + 意图类目 → scoped bind 结果（避免重复 embedding + buildLangChainTools）。 */
  private readonly sessionIntentScopedToolsCache = new Map<
    string,
    CachedScopedToolsEntry
  >();
  /** 类目 id 集合 → ToolCategory 行（进程内共享）。 */
  private readonly toolCategoryRowsCache = new Map<
    string,
    {
      rows: Array<{ id: number; label: string; description: string | null }>;
      expiresAt: number;
    }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptComposer: PromptComposerService,
    private readonly toolEngine: ToolEngineService,
    private readonly chatEvents: ChatEventsService,
    private readonly agentService: AgentService,
    private readonly workingMemoryService: WorkingMemoryService,
    private readonly sessionHistoryCompression: SessionHistoryCompressionService,
    private readonly categoryIntentRecall: CategoryIntentRecallService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly sessionPrepareStore: SessionPrepareStore,
    private readonly intentScopeService: IntentScopeService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
  ) {}

  /** 用户取消待确认的写操作：清除缓存并通知前端关闭确认弹窗。 */
  async cancelPendingWriteConfirmation(
    userId: number,
    sessionId: string,
  ): Promise<void> {
    const pending = await this.pendingWriteConfirmationStore.get(
      sessionId,
      userId,
    );
    await this.pendingWriteConfirmationStore.clear(sessionId);
    if (!pending) {
      return;
    }
    const message = '已取消操作。';
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'write_confirmation_cancelled',
        runId: pending.runId,
        turnId: pending.turnId,
        message,
      },
    });
    this.chatEvents.emit(sessionId, {
      event: 'complete',
      payload: {
        source: 'agent-run',
        runId: pending.runId,
        turnId: pending.turnId,
        status: 'success',
      },
    });
  }

  private emitWriteConfirmationExpired(sessionId: string): void {
    this.chatEvents.emit(sessionId, {
      event: 'error',
      payload: {
        message: '写操作确认已过期或不存在，请重新发起请求。',
        code: 'WRITE_CONFIRMATION_EXPIRED',
      },
    });
  }

  /** 执行一次 Agent 运行。 */
  async run(input: AgentRunInput): Promise<AgentRunResult | null> {
    /**
     * 前置流程：
     * 1) DSN -> appId（由 AppClientDsnGuard 写入会话所属 appClientId）
     * 2) userId -> user role（按 UserApp.roleId 解析）
     * 3) 获取/校验 Session 归属
     * 4) 加载 Agent（prompt/策略）
     * 5) 加载 Tool（按 appId）
     * 6) 按角色过滤 Tool（allowToolLevel + RoleTool）
     */
    // 仅允许用户访问自己的会话。
    const session = await this.prisma.session.findFirst({
      where: { id: input.sessionId, userId: input.userId },
      select: { id: true, agentId: true, appClientId: true },
    });
    if (!session) {
      throw new NotFoundException('chat not found');
    }
    if (!session.agentId) {
      return null;
    }

    if (input.confirmWrite) {
      const resumed = await this.resumePendingWriteConfirmation(input, {
        sessionId: session.id,
        agentId: session.agentId,
        appClientId: session.appClientId,
      });
      if (resumed) {
        return resumed;
      }
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    await this.pendingWriteConfirmationStore.clear(input.sessionId);

    const startedAt = new Date();
    const [agent, messageTokenBudget] = await Promise.all([
      this.agentService.getRuntimeAgent(session.appClientId, session.agentId),
      this.llmService.getMessageTokenBudget(),
    ]);
    if (!agent) {
      throw new NotFoundException(`agent ${session.agentId} not found`);
    }

    const prompt = await this.promptComposer.compose({
      userId: input.userId,
      sessionId: input.sessionId,
      latestUserMessage: input.input,
      agentSystemPrompt: agent.systemPrompt,
      sessionScope: {
        appClientId: session.appClientId,
        agentId: session.agentId,
      },
    });

    const [allowedTools, turn] = await Promise.all([
      this.getSessionAllowedTools(
        input.sessionId,
        agent.id,
        input.userId,
        session.appClientId,
      ),
      this.prisma.messageTurn.create({
        data: {
          messageId: input.userMessageId,
          sessionId: session.id,
          userId: input.userId,
          appClientId: session.appClientId,
          userInput: input.input,
          primaryAgentId: agent.id,
          agentRunCount: 1,
          status: AgentRunStatus.running,
          startedAt,
        },
      }),
    ]);
    const tools: AgentEngineTool[] = allowedTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      schema: tool.schema,
      method: tool.method,
      path: tool.path,
      timeout: tool.timeout,
      integration: {
        id: tool.integration.id,
        name: tool.integration.name,
        baseUrl: tool.integration.baseUrl,
        authMode: tool.integration.authMode,
        apiKey: tool.integration.apiKey,
      },
      toolCategoryId: tool.toolCategoryId ?? null,
      riskLevel: tool.riskLevel,
      responseProfile: tool.responseProfile,
      agentMetadata: tool.agentMetadata,
    }));
    const toolProfilesByName = Object.fromEntries(
      tools.map((tool) => [
        tool.name,
        parseResponseProfile(tool.responseProfile),
      ]),
    ) as Record<string, ToolResponseProfile | null>;
    const allowedToolIds = tools.map((tool) => tool.id);
    const toolBuildCtx: ToolBuildContext = {
      userId: input.userId,
      allowedToolIds,
    };
    const langChainTools = this.toolEngine.buildLangChainTools(tools, toolBuildCtx);

    const run = await this.prisma.agentRun.create({
      data: {
        turnId: turn.id,
        agentId: agent.id,
        appClientId: session.appClientId,
        sessionId: session.id,
        userId: input.userId,
        role: AgentRunRole.primary,
        sequence: 1,
        input: input.input,
        status: AgentRunStatus.running,
        steps: [],
        currentStep: 0,
        maxSteps: agent.maxSteps,
        startedAt,
      },
    });

    const runMetrics = createRunMetricsAccumulator();

    const steps: AgentRunStep[] = [];
    this.resetThinkBuffer(input.sessionId, run.id);
    const promptMessages = prompt.messages;

    let finalOutput = '';
    let status: AgentRunStatus = AgentRunStatus.running;
    let currentStep = 0;
    let runError: string | undefined;

    try {
      const graphState = await this.runWithLangGraph({
        promptMessages,
        latestUserMessage: input.input,
        sessionId: input.sessionId,
        runId: run.id,
        userId: input.userId,
        appClientId: session.appClientId,
        agentId: agent.id,
        maxSteps: agent.maxSteps,
        enableToolCall: agent.enableToolCall,
        tools,
        langChainTools,
        toolBuildCtx,
        allowedToolIds,
        messageTokenBudget,
        runMetrics,
        toolProfilesByName,
        turnId: turn.id,
        confirmWrite: input.confirmWrite ?? false,
      });
      currentStep = graphState.iteration;
      status = graphState.status;
      finalOutput = graphState.finalOutput;
      if (graphState.awaitingWriteConfirmation) {
        finalOutput = this.sanitizeFinalOutput(finalOutput);
        const finishReason = resolveFinishReason({
          status,
          steps: graphState.steps,
          finishedEarly: false,
        });
        await this.finalizeRunAndTurn({
          turnId: turn.id,
          runId: run.id,
          runMetrics,
          finalOutput,
          status,
          finishReason,
          scopedToolCount: graphState.scopedTools.length,
          steps: graphState.steps,
          currentStep: graphState.iteration,
        });
        this.emitRunMessageBlocksIfNeeded(
          input.sessionId,
          run.id,
          turn.id,
          this.blocksFromFinalOutput(finalOutput),
        );
        return { runId: run.id, turnId: turn.id, output: finalOutput, status };
      }
      steps.splice(0, steps.length, ...graphState.steps);

      // 超步数时尝试 fallbackReply 兜底。
      if (status !== AgentRunStatus.success) {
        const fallback = this.resolveFallbackReply(agent.config);
        if (!fallback) {
          throw new BadRequestException('agent run exceeded max steps');
        }
        finalOutput = fallback;
        status = AgentRunStatus.success;
      }
      // 清理最终输出中的 <think> 标签内容。
      finalOutput = this.sanitizeFinalOutput(finalOutput);

      const finishReason = resolveFinishReason({
        status,
        steps,
        finishedEarly: graphState.finished && graphState.iteration === 0,
      });
      await this.finalizeRunAndTurn({
        turnId: turn.id,
        runId: run.id,
        runMetrics,
        finalOutput,
        status,
        finishReason,
        scopedToolCount: graphState.scopedTools.length,
        steps,
        currentStep,
      });

      this.emitRunMessageBlocksIfNeeded(
        input.sessionId,
        run.id,
        turn.id,
        this.blocksFromFinalOutput(finalOutput),
      );
      this.schedulePostRunMemoryTasks(input.sessionId, {
        userInput: input.input,
        finalOutput: this.finalOutputForWorkingMemory(finalOutput),
        toolObservations: graphState.toolObservations,
      });

      return { runId: run.id, turnId: turn.id, output: finalOutput, status };
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      const userFacing = resolveAgentRunFailureUserMessage(error);
      const errorCode = resolveAgentRunFailureCode(error);
      if (!userFacing) {
        runError = errorText;
        status = AgentRunStatus.failed;
        const finishReason = resolveFinishReason({
          status,
          steps,
          finishedEarly: false,
          error: errorText,
        });
        await this.finalizeRunAndTurn({
          turnId: turn.id,
          runId: run.id,
          runMetrics,
          finalOutput,
          status,
          finishReason,
          error: errorText,
          steps,
          currentStep,
        });
        throw error;
      }
      runError = errorText;
      finalOutput = this.sanitizeFinalOutput(userFacing);
      status = AgentRunStatus.success;
      recordMachineCodeUsage(runMetrics, errorCode);
      this.emitLlmReply(input.sessionId, run.id, finalOutput, {
        code: errorCode ?? undefined,
        mode: 'full',
      });
      this.runSseContentDelivered.add(
        this.thinkBufferKey(input.sessionId, run.id),
      );
      const finishReason = resolveFinishReason({
        status,
        steps,
        finishedEarly: false,
        error: errorText,
      });
      await this.finalizeRunAndTurn({
        turnId: turn.id,
        runId: run.id,
        runMetrics,
        finalOutput,
        status,
        finishReason,
        scopedToolCount: tools.length,
        steps,
        currentStep,
      });
      this.schedulePostRunMemoryTasks(input.sessionId, {
        userInput: input.input,
        finalOutput,
        toolObservations: [],
      });
      return { runId: run.id, turnId: turn.id, output: finalOutput, status };
    } finally {
      this.clearThinkBuffer(input.sessionId, run.id);
    }
  }

  /** 用户确认后执行缓存的写操作 Tool，并汇总到原 AgentRun。 */
  private async resumePendingWriteConfirmation(
    input: AgentRunInput,
    session: {
      sessionId: string;
      agentId: number;
      appClientId: number;
    },
  ): Promise<AgentRunResult | null> {
    const pending = await this.pendingWriteConfirmationStore.get(
      input.sessionId,
      input.userId,
    );
    if (!pending) {
      return null;
    }

    const run = await this.prisma.agentRun.findFirst({
      where: {
        id: pending.runId,
        sessionId: pending.sessionId,
        userId: input.userId,
      },
      select: { id: true, turnId: true, steps: true, currentStep: true },
    });
    if (!run?.turnId) {
      return null;
    }

    const agent = await this.agentService.getRuntimeAgent(
      session.appClientId,
      session.agentId,
    );
    if (!agent) {
      return null;
    }

    const consumed = await this.pendingWriteConfirmationStore.consume(
      input.sessionId,
      input.userId,
    );
    if (!consumed || consumed.runId !== pending.runId) {
      return null;
    }
    const [allowedTools, prompt] = await Promise.all([
      this.agentService.getAllowedTools(
        session.agentId,
        input.userId,
        session.appClientId,
      ),
      this.promptComposer.compose({
        userId: input.userId,
        sessionId: input.sessionId,
        latestUserMessage: consumed.latestUserMessage,
        agentSystemPrompt: agent.systemPrompt,
        sessionScope: {
          appClientId: session.appClientId,
          agentId: session.agentId,
        },
      }),
    ]);

    const tools: AgentEngineTool[] = allowedTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      schema: tool.schema,
      method: tool.method,
      path: tool.path,
      timeout: tool.timeout,
      integration: {
        id: tool.integration.id,
        name: tool.integration.name,
        baseUrl: tool.integration.baseUrl,
        authMode: tool.integration.authMode,
        apiKey: tool.integration.apiKey,
      },
      toolCategoryId: tool.toolCategoryId ?? null,
      riskLevel: tool.riskLevel,
      responseProfile: tool.responseProfile,
      agentMetadata: tool.agentMetadata,
    }));
    const allowedToolIds = tools.map((tool) => tool.id);
    const toolBuildCtx: ToolBuildContext = {
      userId: input.userId,
      allowedToolIds,
    };
    const langChainBundle = this.toolEngine.buildLangChainTools(tools, toolBuildCtx);
    const toolProfilesByName = Object.fromEntries(
      tools.map((tool) => [
        tool.name,
        parseResponseProfile(tool.responseProfile),
      ]),
    ) as Record<string, ToolResponseProfile | null>;

    const pendingCalls: GraphToolCall[] = consumed.toolCalls.map((call) => ({
      name: call.name,
      arguments: call.arguments,
    }));
    const toolResults = await Promise.all(
      pendingCalls.map((toolCall) =>
        this.invokeToolSafely(langChainBundle, tools, toolCall),
      ),
    );

    const observations: ToolObservation[] = [];
    const steps = this.parseStepsFromRun(run.steps);
    const runMetrics = createRunMetricsAccumulator();
    let lastObservation: ToolObservation | null = null;

    for (let idx = 0; idx < toolResults.length; idx += 1) {
      const toolResult = toolResults[idx];
      const toolCall = pendingCalls[idx];
      const profile = toolProfilesByName[toolResult.name] ?? null;
      const projected = projectToolOutput(
        toolResult.output,
        consumed.latestUserMessage,
        profile,
      );
      recordToolUsage(runMetrics, {
        name: toolResult.name,
        latencyMs: toolResult.latency,
        quality: this.assessObservationQuality(projected.data),
      });
      const llmPayload = formatObservationForLlm({
        toolName: toolResult.name,
        output: projected.data,
        fieldLabels: projected.fieldLabels,
      });
      const observation: ToolObservation = {
        name: toolResult.name,
        output: projected.data,
        llmPayload,
        quality: this.assessObservationQuality(projected.data),
        fieldLabels: projected.fieldLabels,
        fieldDescriptions: projected.fieldDescriptions,
        enumLabelsByPath: projected.enumLabelsByPath,
      };
      observations.push(observation);
      lastObservation = observation;
      steps.push({
        step: run.currentStep + 1,
        type: 'tool',
        name: toolCall.name,
        input: toolCall.arguments,
        output: projected.data as Record<string, unknown>,
        meta: { latency: toolResult.latency },
      });
    }

    if (!lastObservation) {
      return null;
    }

    const toolDef = tools.find((tool) => tool.name === lastObservation.name);
    const promptScope = {
      appClientId: session.appClientId,
      agentId: session.agentId,
    };
    const summarized = await this.summarizeToolOutputForUser(
      lastObservation.name,
      toolDef?.description,
      consumed.latestUserMessage,
      lastObservation.output,
      lastObservation.fieldLabels ?? {},
      lastObservation.fieldDescriptions ?? {},
      lastObservation.enumLabelsByPath ?? {},
      prompt.messages,
      input.sessionId,
      consumed.runId,
      promptScope,
    );
    const finalOutput = this.sanitizeFinalOutput(
      summarized?.trim() || '操作已完成。',
    );
    steps.push({
      step: run.currentStep + 2,
      type: 'summarize',
      name: lastObservation.name,
      output: finalOutput,
    });

    const finishReason = resolveFinishReason({
      status: AgentRunStatus.success,
      steps,
      finishedEarly: false,
    });
    await this.finalizeRunAndTurn({
      turnId: run.turnId,
      runId: consumed.runId,
      runMetrics,
      finalOutput,
      status: AgentRunStatus.success,
      finishReason,
      scopedToolCount: tools.length,
      steps,
      currentStep: run.currentStep + 2,
    });
    this.emitRunMessageBlocksIfNeeded(
      input.sessionId,
      consumed.runId,
      run.turnId,
      this.blocksFromFinalOutput(finalOutput),
    );
    this.schedulePostRunMemoryTasks(input.sessionId, {
      userInput: consumed.latestUserMessage,
      finalOutput: this.finalOutputForWorkingMemory(finalOutput),
      toolObservations: observations,
    });

    return {
      runId: consumed.runId,
      turnId: run.turnId,
      output: finalOutput,
      status: AgentRunStatus.success,
    };
  }

  private parseStepsFromRun(steps: unknown): AgentRunStep[] {
    if (!Array.isArray(steps)) {
      return [];
    }
    return steps as AgentRunStep[];
  }

  /** 增量更新 AgentRun 当前步骤与状态。 */
  private async updateRun(
    runId: number,
    steps: AgentRunStep[],
    currentStep: number,
    status: AgentRunStatus,
  ): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: { steps: this.toJsonSteps(steps), currentStep, status },
    });
  }

  /** 步骤数据按 JSON 存储。 */
  private toJsonSteps(steps: AgentRunStep[]): Prisma.InputJsonValue {
    return steps as unknown as Prisma.InputJsonValue;
  }

  private async finalizeRunAndTurn(input: {
    turnId: number;
    runId: number;
    runMetrics: RunMetricsAccumulator;
    finalOutput: string;
    status: AgentRunStatus;
    finishReason: string;
    scopedToolCount?: number;
    error?: string;
    steps?: AgentRunStep[];
    currentStep?: number;
  }): Promise<void> {
    const snapshot = snapshotRunMetrics(input.runMetrics);
    const metricsData = {
      finishedAt: new Date(),
      durationMs: snapshot.durationMs,
      llmDurationMs: snapshot.llmDurationMs,
      toolDurationMs: snapshot.toolDurationMs,
      model: snapshot.model ?? null,
      promptTokens: snapshot.promptTokens,
      completionTokens: snapshot.completionTokens,
      totalTokens: snapshot.totalTokens,
      llmCallCount: snapshot.llmCallCount,
      toolCallCount: snapshot.toolCallCount,
      toolsUsed: snapshot.toolsUsed as Prisma.InputJsonValue,
      finishReason: input.finishReason,
    };
    await this.prisma.agentRun.update({
      where: { id: input.runId },
      data: {
        output: input.finalOutput || null,
        status: input.status,
        error: input.error ?? null,
        steps:
          input.steps === undefined
            ? undefined
            : this.toJsonSteps(input.steps),
        currentStep: input.currentStep,
        scopedToolCount: input.scopedToolCount ?? null,
        ...metricsData,
      },
    });
    const agentRunCount = await this.prisma.agentRun.count({
      where: { turnId: input.turnId },
    });
    await this.prisma.messageTurn.update({
      where: { id: input.turnId },
      data: {
        finalOutput: input.finalOutput || null,
        status: input.status,
        agentRunCount,
        ...metricsData,
      },
    });
  }

  private thinkBufferKey(sessionId: string, runId: number): string {
    return `${sessionId}:${runId}`;
  }

  private resetThinkBuffer(sessionId: string, runId: number): void {
    this.thinkBuffers.set(this.thinkBufferKey(sessionId, runId), '');
    this.streamSeq.set(this.thinkBufferKey(sessionId, runId), 0);
  }

  private clearThinkBuffer(sessionId: string, runId: number): void {
    const key = this.thinkBufferKey(sessionId, runId);
    this.thinkBuffers.delete(key);
    this.streamSeq.delete(key);
    this.messageStreamDeltaEmitted.delete(key);
    this.runSseContentDelivered.delete(key);
  }

  /** 工作记忆刷新与历史压缩不阻塞 SSE complete / 下一轮 run 返回。 */
  private schedulePostRunMemoryTasks(
    sessionId: string,
    ctx: WorkingMemoryUpdateContext,
  ): void {
    void this.workingMemoryService
      .refreshFromAgentRun(sessionId, ctx)
      .then(() => this.sessionHistoryCompression.maybeCompressAfterTurn(sessionId))
      .catch((error) => {
        this.logger.warn(
          `post-run memory tasks failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  }

  /**
   * 兜底：未走 summarize 流式 / patch 时，在 run 结束前推一次 stream full。
   * 不再使用 action=final；本轮结束以 complete 为准。
   */
  private emitRunMessageBlocksIfNeeded(
    sessionId: string,
    runId: number,
    turnId: number,
    blocks: MessageBlock[],
  ): void {
    const runKey = this.thinkBufferKey(sessionId, runId);
    if (blocks.length === 0) {
      return;
    }
    if (this.runSseContentDelivered.has(runKey)) {
      return;
    }
    if (
      this.messageStreamDeltaEmitted.has(runKey) &&
      blocks.every((block) => block.type === 'text')
    ) {
      return;
    }
    this.emitMessageBlocks(sessionId, runId, blocks, {
      action: 'stream',
      mode: 'full',
      turnId,
    });
    this.runSseContentDelivered.add(runKey);
  }

  private markRunSseContentDelivered(
    runKey: string,
    blocks: MessageBlock[],
    options: { textStreamed: boolean; structuredPatches: number },
  ): void {
    const hasStructured = blocks.some(isStructuredMessageBlock);
    const hasText = blocks.some((block) => block.type === 'text');
    if (!hasStructured && hasText && options.textStreamed) {
      this.runSseContentDelivered.add(runKey);
      return;
    }
    if (
      hasStructured &&
      options.structuredPatches > 0 &&
      (!hasText || options.textStreamed)
    ) {
      this.runSseContentDelivered.add(runKey);
    }
  }

  /**
   * 推送 think SSE：payload.content 为当前 run 内累积全文（前端直接覆盖展示即可）。
   */
  private emitThink(
    sessionId: string,
    runId: number,
    chunk: string,
    mode: 'append' | 'replace' = 'append',
  ): void {
    if (!chunk) {
      return;
    }
    const key = this.thinkBufferKey(sessionId, runId);
    const prev = this.thinkBuffers.get(key) ?? '';
    const next = mode === 'replace' ? chunk : prev + chunk;
    this.thinkBuffers.set(key, next);
    this.chatEvents.emit(sessionId, {
      event: 'think',
      payload: { content: next },
    });
  }

  private finalOutputForWorkingMemory(finalOutput: string): string {
    const blocks = tryParseStoredMessageBlocks(finalOutput);
    if (blocks?.length) {
      return messageBlocksToPlainText(blocks);
    }
    return finalOutput;
  }

  private blocksFromFinalOutput(finalOutput: string): MessageBlock[] {
    const blocks = tryParseStoredMessageBlocks(finalOutput);
    if (blocks?.length) {
      return blocks;
    }
    const text = this.sanitizeFinalOutput(finalOutput);
    return text ? [textBlock(text)] : [];
  }

  /** Message Blocks SSE（stream 增量/整段 或 patch 前的占位）。 */
  private emitMessageBlocks(
    sessionId: string,
    runId: number | undefined,
    blocks: MessageBlock[],
    options?: {
      code?: AgentMachineCode;
      mode?: 'delta' | 'full';
      action?: 'stream';
      turnId?: number;
    },
  ): void {
    const normalized = normalizeMessageBlocks(blocks);
    if (normalized.length === 0) {
      return;
    }
    const key = runId == null ? null : this.thinkBufferKey(sessionId, runId);
    const action = options?.action ?? 'stream';
    const mode = options?.mode ?? 'full';
    if (key && action === 'stream' && mode === 'delta') {
      this.messageStreamDeltaEmitted.add(key);
    }
    const nextSeq = key ? (this.streamSeq.get(key) ?? 0) + 1 : undefined;
    if (key && nextSeq != null) {
      this.streamSeq.set(key, nextSeq);
    }
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action,
        runId,
        turnId: options?.turnId,
        blocks: normalized,
        code: options?.code,
        seq: nextSeq,
        mode,
      },
    });
  }

  /** 用实际 block 替换此前 loading 占位（SSE action=patch，非全量 blocks）。 */
  private emitBlockPatch(
    sessionId: string,
    runId: number,
    patch: MessageBlockPatch,
  ): void {
    const block = normalizeMessageBlocks([patch.block])[0];
    if (!block || block.type === 'loading') {
      return;
    }
    const key = this.thinkBufferKey(sessionId, runId);
    const nextSeq = (this.streamSeq.get(key) ?? 0) + 1;
    this.streamSeq.set(key, nextSeq);
    this.chatEvents.emit(sessionId, {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'patch',
        runId,
        patches: [{ replaceId: patch.replaceId, block }],
        seq: nextSeq,
      },
    });
  }

  /** 决策环等流式文本：单 text block 增量。 */
  private emitLlmReply(
    sessionId: string,
    runId: number | undefined,
    output: string,
    options?: {
      code?: AgentMachineCode;
      mode?: 'delta' | 'full';
      turnId?: number;
    },
  ): void {
    const text = this.sanitizeFinalOutput(output);
    if (!text) {
      return;
    }
    this.emitMessageBlocks(
      sessionId,
      runId,
      [textBlock(text)],
      {
        code: options?.code,
        mode: options?.mode ?? 'delta',
        turnId: options?.turnId,
      },
    );
  }

  /** LangChain stream：每个 token 立即 emitLlmReply。 */
  private async streamRunnableMessages(
    runnable: {
      stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
      invoke: (messages: unknown[]) => Promise<AIMessage>;
    },
    messages: Array<Record<string, string>>,
    sessionId: string,
    runId: number,
  ): Promise<AIMessage> {
    let merged: AIMessageChunk | undefined;
    let streamedText = '';
    try {
      const stream = await runnable.stream(messages);
      for await (const chunk of stream) {
        const row = chunk as AIMessageChunk;
        const delta = this.extractAiMessageText(row as AIMessage);
        if (delta) {
          streamedText += delta;
          this.emitLlmReply(sessionId, runId, delta, { mode: 'delta' });
        }
        merged = merged ? merged.concat(row) : row;
      }
    } catch (error) {
      this.logger.warn(
        `llm stream fallback to invoke sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const aiMessage = await runnable.invoke(messages);
      const text = this.extractAiMessageText(aiMessage).trim();
      if (text) {
        this.emitLlmReply(sessionId, runId, text, { mode: 'full' });
      }
      return aiMessage;
    }
    if (merged) {
      const aiMessage = new AIMessage({
        content: merged.content,
        tool_calls: merged.tool_calls,
        additional_kwargs: merged.additional_kwargs,
        response_metadata: merged.response_metadata,
      });
      const text = this.extractAiMessageText(aiMessage).trim();
      if (text && !streamedText) {
        this.emitLlmReply(sessionId, runId, text, { mode: 'full' });
      }
      return aiMessage;
    }
    if (streamedText) {
      return new AIMessage({ content: streamedText });
    }
    return new AIMessage({ content: '' });
  }

  /** 规范化步骤 input/output，便于序列化入库。 */
  private normalizeJsonLike(
    value: unknown,
  ): Record<string, unknown> | string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return String(value);
  }

  private tryParseJsonObject(value: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private buildWorkingMemoryHintForPrecheck(
    workingMemory: WorkingMemoryState | null,
  ): string {
    if (!workingMemory) {
      return '';
    }
    const parts: string[] = [];
    if (workingMemory.lastToolSummary?.trim()) {
      parts.push(`lastToolSummary=${workingMemory.lastToolSummary.trim()}`);
    }
    const facts = Array.isArray(workingMemory.facts)
      ? workingMemory.facts
          .filter((item) => item && item.key && item.value)
          .slice(-6)
          .map((item) => `${item.key}: ${item.value}`)
      : [];
    if (facts.length > 0) {
      parts.push(`facts=${facts.join(' | ')}`);
    }
    return parts.join('; ');
  }

  private buildWorkingMemoryObservationForSummary(
    workingMemory: WorkingMemoryState | null,
  ): ToolObservation | null {
    if (!workingMemory) {
      return null;
    }
    const facts = Array.isArray(workingMemory.facts)
      ? workingMemory.facts.slice(-10)
      : [];
    const entities =
      workingMemory.entities &&
      typeof workingMemory.entities === 'object' &&
      !Array.isArray(workingMemory.entities)
        ? workingMemory.entities
        : {};
    if (!workingMemory.lastToolSummary?.trim() && facts.length === 0) {
      return null;
    }
    return {
      name: 'working_memory',
      output: {
        summary: workingMemory.lastToolSummary ?? '',
        facts,
        entities,
        updatedAt: workingMemory.updatedAt,
      },
      quality: 'medium',
    };
  }

  /** 主推理调用：Agent → Memory → Observations → Tool schema → User。 */
  private buildLlmInvokeMessages(
    promptMessages: LlmChatMessage[],
    observations: ToolObservation[],
    latestUserMessage: string,
    toolSchemaJson: string,
    toolDecisionPrompt: string,
    messageTokenBudget: number,
  ): {
    messages: Array<{ role: string; content: string; toolCallId?: string }>;
    trimMeta: {
      configuredBudget: number;
      effectiveBudget: number;
      estimatedTokensBefore: number;
      estimatedTokensAfter: number;
      trimmed: boolean;
      droppedMessageIndexes: number[];
      truncatedMessageIndexes: number[];
    };
  } {
    const messages: LlmChatMessage[] = [];

    for (const item of extractAgentPromptMessages(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    for (const item of extractWorkingMemoryMessages(promptMessages)) {
      messages.push({ role: item.role, content: item.content });
    }

    const observationPayloads = dedupeObservationPayloads(
      observations.map(
        (observation) =>
          observation.llmPayload ??
          formatObservationForLlm({
            toolName: observation.name,
            output: observation.output,
            fieldLabels: observation.fieldLabels,
          }),
      ),
    );
    if (observationPayloads.length > 0) {
      messages.push({
        role: 'assistant',
        content: `<observations>\n${serializeObservationsBlock(observationPayloads)}\n</observations>`,
      });
    }

    messages.push({
      role: 'tool',
      content: `<tool_schema>\n${toolSchemaJson}\n</tool_schema>`,
      toolCallId: 'decision_tool_schema',
    });
    messages.push({
      role: 'system',
      content: `<tool_decision>\n${toolDecisionPrompt}\n</tool_decision>`,
    });

    const pinnedUser = this.buildPinnedUserRequestMessage(latestUserMessage);
    if (pinnedUser) {
      messages.push(pinnedUser);
    }

    const estimatedTokens = estimateMessagesTokens(messages);

    return {
      messages: messages.map((item) => ({
        role: item.role,
        content: item.content,
        ...(item.toolCallId ? { toolCallId: item.toolCallId } : {}),
      })),
      trimMeta: {
        configuredBudget: messageTokenBudget,
        effectiveBudget: messageTokenBudget,
        estimatedTokensBefore: estimatedTokens,
        estimatedTokensAfter: estimatedTokens,
        trimmed: false,
        droppedMessageIndexes: [],
        truncatedMessageIndexes: [],
      },
    };
  }

  private buildPinnedUserRequestMessage(
    latestUserMessage: string,
  ): LlmChatMessage | null {
    const trimmed = latestUserMessage.trim();
    if (!trimmed) {
      return null;
    }
    return {
      role: 'user',
      content: `<current_user_request>\n${trimmed}\n</current_user_request>`,
    };
  }

  private toLangChainInvokeMessage(message: {
    role: string;
    content: string;
    toolCallId?: string;
  }): Record<string, string> {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content,
        tool_call_id: message.toolCallId ?? 'decision_tool_schema',
      };
    }
    return {
      role: message.role,
      content: message.content,
    };
  }

  /** 工具决策提示 + 精简 schema（观测与用户问句由 buildLlmInvokeMessages 单独注入）。 */
  private async buildDecisionPrompt(
    promptMessages: LlmChatMessage[],
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
      schema: unknown;
      responseProfile: unknown;
      agentMetadata: unknown;
      method: string;
    }>,
    observations: ToolObservation[],
    enableToolCall: boolean,
    scope: { appClientId: number; agentId: number },
  ): Promise<{
    toolDecisionPrompt: string;
    toolSchemaJson: string;
    observationsJson: string;
    agentPrompt: string | null;
  }> {
    const agentPrompt = joinAgentPromptText(promptMessages);
    const toolSchema = summarizeToolsForLlmSchema(
      tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        schema: tool.schema,
        responseProfile: tool.responseProfile,
        agentMetadata: tool.agentMetadata,
        method: tool.method,
      })),
    );
    const toolCallInstruction = enableToolCall
      ? 'If a tool is needed, use native tool_calls. If not needed, answer in message content with empty tool_calls.'
      : 'Tool calling is disabled. Reply directly in message content with empty tool_calls.';
    const toolDecisionPrompt = await this.renderToolDecisionTemplate(
      scope,
      toolCallInstruction,
    );
    const observationPayloads = observations.map((observation) =>
      observation.llmPayload ??
      formatObservationForLlm({
        toolName: observation.name,
        output: observation.output,
        fieldLabels: observation.fieldLabels,
      }),
    );
    return {
      toolDecisionPrompt,
      toolSchemaJson: JSON.stringify(toolSchema),
      observationsJson: serializeObservationsBlock(observationPayloads),
      agentPrompt,
    };
  }

  private async renderToolDecisionTemplate(
    scope: { appClientId: number; agentId: number },
    toolCallInstruction: string,
  ): Promise<string> {
    const variables = { toolCallInstruction };
    const toolDecision = await this.promptRegistry.render(
      PROMPT_KEYS.AGENT_TOOL_DECISION,
      scope,
      variables,
    );
    if (toolDecision.trim().length > 0) {
      return toolDecision;
    }
    return this.promptRegistry.render(
      PROMPT_KEYS.AGENT_DECISION_LOOP,
      scope,
      variables,
    );
  }

  private stringifyForPrompt(value: unknown): string {
    const maxChars = 6000;
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);
      if (serialized.length <= maxChars) {
        return serialized;
      }
      return `${serialized.slice(0, maxChars)}...(truncated)`;
    } catch {
      return String(value);
    }
  }

  private extractRequiredParamNames(inputSchema: unknown): string[] {
    if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
      return [];
    }
    const row = inputSchema as Record<string, unknown>;
    const params = row.parameters;
    if (!Array.isArray(params)) {
      return [];
    }
    return params
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const param = item as Record<string, unknown>;
        const required = param.required === true;
        const name =
          typeof param.name === 'string' && param.name.trim().length > 0
            ? param.name.trim()
            : null;
        if (!required || !name) {
          return null;
        }
        return name;
      })
      .filter((name): name is string => name != null);
  }

  /** 读取 agent.config 中的 fallbackReply。 */
  private resolveFallbackReply(config: unknown): string | null {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return null;
    }
    const row = config as Record<string, unknown>;
    const fallback = row.fallbackReply;
    if (typeof fallback !== 'string') {
      return null;
    }
    return fallback.trim().length > 0 ? fallback.trim() : null;
  }

  /** 剥离最终输出中的 <think>...</think> 块。 */
  private sanitizeFinalOutput(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    const withoutThink = trimmed
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .trim();
    return withoutThink || trimmed;
  }

  /** 在本轮可用工具拉取关联的 ToolCategory 说明，供向量召回使用。 */
  private async fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]) {
    const uniq = Array.from(new Set(toolCategoryIds)).sort((a, b) => a - b);
    if (uniq.length === 0) {
      return [];
    }
    const cacheKey = uniq.join(',');
    const cached = this.toolCategoryRowsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rows;
    }
    const rows = await this.prisma.toolCategory.findMany({
      where: { id: { in: uniq } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, description: true },
    });
    this.toolCategoryRowsCache.set(cacheKey, {
      rows,
      expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
    });
    this.pruneTimedCacheMap(this.toolCategoryRowsCache);
    return rows;
  }

  private async getSessionAllowedTools(
    sessionId: string,
    agentId: number,
    userId: number,
    appClientId: number,
  ): Promise<Awaited<ReturnType<AgentService['getAllowedTools']>>> {
    const cacheKey = `${sessionId}:${agentId}:${userId}`;
    const cached = this.sessionAllowedToolsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tools;
    }
    const fromRedis = await this.sessionPrepareStore.get(
      sessionId,
      userId,
      appClientId,
      agentId,
    );
    if (fromRedis) {
      this.sessionAllowedToolsCache.set(cacheKey, {
        tools: fromRedis,
        expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
      });
      return fromRedis;
    }
    const tools = await this.agentService.getAllowedTools(
      agentId,
      userId,
      appClientId,
    );
    this.sessionAllowedToolsCache.set(cacheKey, {
      tools,
      expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
    });
    this.pruneTimedCacheMap(this.sessionAllowedToolsCache);
    void this.sessionPrepareStore.trySet(
      sessionId,
      userId,
      appClientId,
      agentId,
      tools,
    );
    return tools;
  }

  private buildToolIdsFingerprint(tools: AgentEngineTool[]): string {
    return tools
      .map((tool) => tool.id)
      .sort((a, b) => a - b)
      .join(',');
  }

  private buildIntentScopeCacheKey(
    sessionId: string,
    matchedCategoryIds: number[],
    userMessage: string,
  ): string {
    const cats = [...matchedCategoryIds].sort((a, b) => a - b).join(',');
    // bind Top-K 依赖 userMessage；缓存键必须包含问句，避免同类目下错绑工具。
    const msg = userMessage.trim().toLowerCase().replace(/\s+/g, ' ');
    return `${sessionId}:intent:${cats || 'none'}:${msg}`;
  }

  private async resolveScopedToolsForIntent(input: {
    sessionId: string;
    userMessage: string;
    tools: AgentEngineTool[];
    toolBuildCtx: ToolBuildContext;
    matchedCategoryIds: number[];
  }): Promise<ScopedToolsResult & { fromCache: boolean }> {
    const toolFingerprint = this.buildToolIdsFingerprint(input.tools);
    const cacheKey = this.buildIntentScopeCacheKey(
      input.sessionId,
      input.matchedCategoryIds,
      input.userMessage,
    );
    const cached = this.sessionIntentScopedToolsCache.get(cacheKey);
    if (
      cached &&
      cached.expiresAt > Date.now() &&
      cached.toolFingerprint === toolFingerprint
    ) {
      return {
        scopedTools: cached.scopedTools,
        scopedLangChainTools: cached.scopedLangChainTools,
        scopedToolBundle: cached.scopedToolBundle,
        scopedAllowedToolIds: cached.scopedAllowedToolIds,
        bindCap: cached.bindCap,
        fallbackReason: cached.fallbackReason,
        fromCache: true,
      };
    }
    const scoped = await this.scopeToolsForMainLoop(
      input.tools,
      input.userMessage,
      input.toolBuildCtx,
      input.matchedCategoryIds,
    );
    this.sessionIntentScopedToolsCache.set(cacheKey, {
      ...scoped,
      toolFingerprint,
      expiresAt: Date.now() + SESSION_TOOL_CACHE_TTL_MS,
    });
    this.pruneTimedCacheMap(this.sessionIntentScopedToolsCache);
    return { ...scoped, fromCache: false };
  }

  private pruneTimedCacheMap<K, V extends { expiresAt: number }>(
    map: Map<K, V>,
  ): void {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (entry.expiresAt <= now) {
        map.delete(key);
      }
    }
    while (map.size > MAX_SESSION_TOOL_CACHE_ENTRIES) {
      const first = map.keys().next().value;
      if (first === undefined) {
        break;
      }
      map.delete(first);
    }
  }

  /** 在已通过角色/Agent 权限过滤后的工具集合上，再按意图分类收窄 bindTools 范围。 */
  private filterToolsByIntent(
    tools: AgentEngineTool[],
    parsed: ParsedIntentPayload,
  ): AgentEngineTool[] {
    if (!parsed.intentClear) {
      return tools;
    }
    const idSet = new Set(parsed.matchedCategoryIds);
    // 未命中任何业务类目：不在此处直接清空，继续走工具级召回决定是否保留工具。
    // 这样可避免“类目标签缺失”导致业务问句也拿不到工具。
    if (idSet.size === 0 && !parsed.includeUncategorized) {
      return tools;
    }
    const narrowed = tools.filter((t) => {
      if (t.toolCategoryId != null && idSet.has(t.toolCategoryId)) {
        return true;
      }
      if (t.toolCategoryId == null && parsed.includeUncategorized) {
        return true;
      }
      return false;
    });
    // 已命中类目但该类目下无工具时，仍回退全量（兼容数据缺口）
    return narrowed.length > 0 ? narrowed : tools;
  }

  /** 类目过滤后，再按向量 Top-K 截断 bindTools 数量。 */
  private async scopeToolsForMainLoop(
    tools: AgentEngineTool[],
    userMessage: string,
    toolBuildCtx: ToolBuildContext,
    preferredCategoryIds?: number[],
  ): Promise<{
    scopedTools: AgentEngineTool[];
    scopedLangChainTools: DynamicStructuredTool[];
    scopedToolBundle: BuiltLangChainTools;
    scopedAllowedToolIds: number[];
    bindCap?: Record<string, unknown>;
    fallbackReason?: 'bind_recall_error' | 'bind_recall_empty';
  }> {
    const result = await this.intentScopeService.scopeToolsForMainLoop(
      tools,
      userMessage,
      toolBuildCtx,
      preferredCategoryIds,
      true,
    );
    const scopedToolBundle =
      result.scopedToolBundle ??
      this.toolEngine.buildLangChainTools(tools, {
        ...toolBuildCtx,
        allowedToolIds: tools.map((tool) => tool.id),
      });
    return {
      scopedTools: result.scopedTools as AgentEngineTool[],
      scopedLangChainTools: result.scopedLangChainTools,
      scopedToolBundle,
      scopedAllowedToolIds: result.scopedAllowedToolIds,
      bindCap: result.bindCap,
      fallbackReason: result.fallbackReason,
    };
  }

  private async runWithLangGraph(input: {
    /** PromptComposer 产出的基础消息（系统提示、记忆、历史对话）。 */
    promptMessages: LlmChatMessage[];
    /** 最新用户输入，仅用于 intent 识别。 */
    latestUserMessage: string;
    /** SSE 推送目标会话。 */
    sessionId: string;
    /** AgentRun 主键，用于增量回写步骤。 */
    runId: number;
    /** 当前会话用户，用于按用户读取集成认证信息。 */
    userId: number;
    /** 最大 llm 循环轮次。 */
    maxSteps: number;
    /** Agent 配置是否允许工具调用。 */
    enableToolCall: boolean;
    /** 初始候选工具（已过 Agent + 角色权限过滤）。 */
    tools: AgentEngineTool[];
    /** 初始 LangChain tool 集合（与 tools 一一对应）。 */
    langChainTools: ReturnType<ToolEngineService['buildLangChainTools']>;
    /** 构建 / 执行 LangChain tool 时的用户与权限上下文。 */
    toolBuildCtx: ToolBuildContext;
    /** tools 对应可执行 toolId 白名单。 */
    allowedToolIds: number[];
    /** LLM 输入消息的 token 预算（由模型 maxTokens / contextLength 推导）。 */
    messageTokenBudget: number;
    /** 运行用量累加器（进程内可变对象）。 */
    runMetrics: RunMetricsAccumulator;
    /** toolName -> responseProfile，与 graph state.toolProfilesByName 同源。 */
    toolProfilesByName: Record<string, ToolResponseProfile | null>;
    appClientId: number;
    agentId: number;
    turnId: number;
    confirmWrite: boolean;
  }): Promise<AgentGraphState> {
    const promptScope = {
      appClientId: input.appClientId,
      agentId: input.agentId,
    };
    const shouldSkipIntentNode = (): boolean =>
      input.enableToolCall &&
      input.tools.length > 0 &&
      input.tools.length < INTENT_FULL_BIND_TOOL_THRESHOLD;
    const buildFullBindIntentState = (
      state: AgentGraphState,
      idx: number,
      reason: string,
    ): AgentGraphState => {
      const intentStep: AgentRunStep = {
        step: idx,
        type: 'intent',
        output: this.normalizeJsonLike({
          skipped: true,
          reason,
          toolCount: input.tools.length,
          bindToolCount: input.tools.length,
        }),
      };
      return {
        ...state,
        steps: [...state.steps, intentStep],
        intentKind: 'task',
        scopedTools: input.tools,
        scopedLangChainTools: input.langChainTools.tools,
        scopedToolBundle: input.langChainTools,
        scopedAllowedToolIds: input.allowedToolIds,
      };
    };
    // LangGraph 状态定义：每个字段的 reducer 采用“直接覆盖最新值”。
    const State = Annotation.Root({
      iteration: Annotation<number>({
        default: () => 0,
        reducer: (_state, update) => update,
      }),
      steps: Annotation<AgentRunStep[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      toolObservations: Annotation<Array<{ name: string; output: unknown }>>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingToolCalls: Annotation<GraphToolCall[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      pendingSummaryObservation: Annotation<{
        name: string;
        output: unknown;
      } | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      intentKind: Annotation<'task' | 'smalltalk' | 'unclear'>({
        default: () => 'task',
        reducer: (_state, update) => update,
      }),
      finalOutput: Annotation<string>({
        default: () => '',
        reducer: (_state, update) => update,
      }),
      status: Annotation<AgentRunStatus>({
        default: () => AgentRunStatus.running,
        reducer: (_state, update) => update,
      }),
      finished: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      scopedTools: Annotation<AgentEngineTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedLangChainTools: Annotation<DynamicStructuredTool[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedAllowedToolIds: Annotation<number[]>({
        default: () => [],
        reducer: (_state, update) => update,
      }),
      scopedToolBundle: Annotation<BuiltLangChainTools | null>({
        default: () => null,
        reducer: (_state, update) => update,
      }),
      toolProfilesByName: Annotation<Record<string, ToolResponseProfile | null>>({
        default: () => ({}),
        reducer: (_state, update) => update,
      }),
      hasExpandedOnce: Annotation<boolean>({
        default: () => false,
        reducer: (_state, update) => update,
      }),
      awaitingWriteConfirmation: Annotation<boolean | undefined>({
        default: () => undefined,
        reducer: (_state, update) => update,
      }),
    });
    // 节点0：前置短路检查。仅在已有 observation 时，借助 LLM 判断是否可直接进入 summarize。
    const preCheck = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const step = state.steps.length + 1;
      const workingMemory = await this.workingMemoryService.get(input.sessionId);
      const workingMemoryHint = this.buildWorkingMemoryHintForPrecheck(workingMemory);
      // 仅按 working memory 决定是否触发 precheck。
      if (!workingMemoryHint) {
        return state;
      }

      try {
        const startedAt = Date.now();
        const precheckPrompt = await this.promptRegistry.render(
          PROMPT_KEYS.AGENT_PRECHECK_HISTORY_ANSWERABLE,
          promptScope,
        );
        const precheckMessages: LlmChatMessage[] = [
          {
            role: 'system',
            content: precheckPrompt,
          },
          {
            role: 'user',
            content: [
              `Latest user message: ${input.latestUserMessage}`,
              `Working memory hints: ${workingMemoryHint || 'none'}`,
            ].join('\n'),
          },
        ];
        let modelName: string | undefined;
        let parsedAnswerable: boolean | undefined;
        let reason: string | null = null;
        try {
          const { model } = await this.llmService.createLangChainChatModelForMessages(
            precheckMessages,
          );
          const structuredModel = model.withStructuredOutput(precheckDecisionSchema);
          const structured = await structuredModel.invoke(precheckMessages);
          parsedAnswerable = structured.answerableFromObservation;
          reason =
            typeof structured.reason === 'string' ? structured.reason : null;
        } catch {
          const precheckResult = await this.llmService.chat({
            messages: precheckMessages,
            tools: [],
          });
          modelName = precheckResult.model;
          const parsed = this.tryParseJsonObject(precheckResult.content);
          if (typeof parsed?.['answerableFromObservation'] === 'boolean') {
            parsedAnswerable = parsed['answerableFromObservation'];
          }
          reason = typeof parsed?.['reason'] === 'string' ? parsed['reason'] : null;
        }
        const latency = Date.now() - startedAt;
        const answerableFromObservation =
          typeof parsedAnswerable === 'boolean'
            ? parsedAnswerable
            : false;
        const reasonCode: PrecheckReasonCode =
          typeof parsedAnswerable !== 'boolean'
            ? 'PRECHECK_PARSE_FAILED'
            : answerableFromObservation
              ? 'HISTORY_SUFFICIENT'
              : 'HISTORY_INSUFFICIENT';
        const chosenObservation = answerableFromObservation
          ? this.pickObservationForFinalSummary(state.toolObservations) ??
            this.buildWorkingMemoryObservationForSummary(workingMemory)
          : null;
        const precheckStep: AgentRunStep = {
          step,
          type: 'precheck',
          output: this.normalizeJsonLike({
            precheck: true,
            answerableFromObservation,
            reasonCode,
            reason,
            observationCount: state.toolObservations.length,
            selectedObservationName: chosenObservation?.name ?? null,
          }),
          meta: {
            model: modelName,
            latency,
            code: reasonCode,
          },
        };
        const steps = [...state.steps, precheckStep];
        await this.updateRun(input.runId, steps, state.iteration, AgentRunStatus.running);
        return {
          ...state,
          steps,
          pendingSummaryObservation: chosenObservation,
        };
      } catch (error) {
        const precheckStep: AgentRunStep = {
          step,
          type: 'precheck',
          output: this.normalizeJsonLike({
            precheck: true,
            answerableFromObservation: false,
            reasonCode: 'PRECHECK_LLM_FAILED',
            reason:
              error instanceof Error ? error.message : 'precheck llm call failed',
            observationCount: state.toolObservations.length,
            selectedObservationName: null,
          }),
          meta: {
            code: 'PRECHECK_LLM_FAILED',
          },
        };
        const steps = [...state.steps, precheckStep];
        await this.updateRun(input.runId, steps, state.iteration, AgentRunStatus.running);
        this.logger.warn(
          `precheck failed runId=${input.runId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        // 失败时兜底走原流程（intent），不阻断主链路。
        return {
          ...state,
          steps,
        };
      }
    };

    // 节点1：意图识别 + 工具收窄（按 toolCategory），必要时直接结束并返回引导语。
    const intent = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const idx = state.steps.length + 1;
      const baseScopedTools = input.tools;
      const baseLcTools = input.langChainTools.tools;
      const baseIds = input.allowedToolIds;

      const skipRecognition = !input.enableToolCall || input.tools.length === 0;
      const intentKind = classifyIntentKind(
        input.latestUserMessage,
        loadSmallTalkHints(),
      );

      if (skipRecognition) {
        // 工具关闭或无工具可用：跳过识别，沿用初始 scoped 集合。
        this.emitThink(
          input.sessionId,
          input.runId,
          '正在处理你的请求…\n',
          'replace',
        );
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            skipped: true,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, intentStep],
          intentKind,
          scopedTools: baseScopedTools,
          scopedLangChainTools: baseLcTools,
          scopedToolBundle: input.langChainTools,
          scopedAllowedToolIds: baseIds,
        };
      }

      if (shouldSkipIntentNode()) {
        this.emitThink(
          input.sessionId,
          input.runId,
          '正在处理你的请求…\n',
          'replace',
        );
        const next = buildFullBindIntentState(
          state,
          idx,
          'few_tools_full_bind',
        );
        await this.updateRun(
          input.runId,
          next.steps,
          0,
          AgentRunStatus.running,
        );
        return next;
      }

      if (intentKind === 'smalltalk') {
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            intentKind: 'smalltalk',
            recallSource: 'none',
            skippedTools: true,
          }),
        };
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, intentStep],
          intentKind: 'smalltalk',
          pendingSummaryObservation: {
            name: 'smalltalk',
            output: {
              userMessage: input.latestUserMessage,
            },
          },
          scopedTools: [],
          scopedLangChainTools: [],
          scopedToolBundle: null,
          scopedAllowedToolIds: [],
        };
      }

      this.emitThink(
        input.sessionId,
        input.runId,
        '正在理解你的问题…\n',
        'replace',
      );

      const categoryIds = [
        ...new Set(
          input.tools
            .map((t) => t.toolCategoryId)
            .filter((id): id is number => id != null),
        ),
      ];
      const categories = await this.fetchToolCategoriesForAllowedTools(
        categoryIds,
      );

      const intentClear = isUserIntentMessageClear(input.latestUserMessage);
      if (!intentClear) {
        const guidance = buildIntentClarificationGuidance(
          input.latestUserMessage,
        );
        const intentStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            intentClear: false,
            recallSource: 'none',
          }),
        };
        this.emitLlmReply(input.sessionId, input.runId, guidance, {
          mode: 'full',
        });
        await this.updateRun(
          input.runId,
          [...state.steps, intentStep],
          0,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: [...state.steps, intentStep],
          intentKind: 'unclear',
          finished: true,
          finalOutput: guidance,
          status: AgentRunStatus.success,
          scopedTools: baseScopedTools,
          scopedLangChainTools: baseLcTools,
          scopedToolBundle: input.langChainTools,
          scopedAllowedToolIds: baseIds,
        };
      }

      let recallResult;
      try {
        recallResult = await this.categoryIntentRecall.recallTopCategories(
          categories,
          input.latestUserMessage,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`category intent recall failed: ${message}`);
        this.emitThink(
          input.sessionId,
          input.runId,
          '正在使用备用方式理解你的问题…\n',
          'append',
        );
        const fallbackStep: AgentRunStep = {
          step: idx,
          type: 'intent',
          output: this.normalizeJsonLike({
            error: message,
            fallback: true,
            fallbackReason: 'category_recall_error',
          }),
          meta: { code: 'INTENT_RECALL_FAILED' },
        };
        recordMachineCodeUsage(input.runMetrics, 'INTENT_RECALL_FAILED');
        const scoped = await this.resolveScopedToolsForIntent({
          sessionId: input.sessionId,
          userMessage: input.latestUserMessage,
          tools: baseScopedTools,
          toolBuildCtx: input.toolBuildCtx,
          matchedCategoryIds: [],
        });
        fallbackStep.output = this.normalizeJsonLike({
          error: message,
          fallback: true,
          fallbackReason: 'category_recall_error',
          scopeFromCache: scoped.fromCache,
          ...(scoped.bindCap
            ? {
                bindToolsCap: scoped.bindCap,
                bindFallbackReason: scoped.fallbackReason,
              }
            : {}),
        });
        await this.updateRun(
          input.runId,
          [...state.steps, fallbackStep],
          0,
          AgentRunStatus.running,
        );
        return {
          ...state,
          steps: [...state.steps, fallbackStep],
          intentKind: 'task',
          scopedTools: scoped.scopedTools,
          scopedLangChainTools: scoped.scopedLangChainTools,
          scopedToolBundle: scoped.scopedToolBundle,
          scopedAllowedToolIds: scoped.scopedAllowedToolIds,
        };
      }

      const validCategoryIdSet = new Set(categories.map((c) => c.id));
      const matchedCategoryIds = recallResult.matchedCategoryIds.filter((id) =>
        validCategoryIdSet.has(id),
      );
      const parsed: ParsedIntentPayload = {
        intentClear: true,
        guidance: '',
        matchedCategoryIds,
        includeUncategorized: false,
      };

      const narrowed = this.filterToolsByIntent(input.tools, parsed);
      const scoped = await this.resolveScopedToolsForIntent({
        sessionId: input.sessionId,
        userMessage: input.latestUserMessage,
        tools: narrowed,
        toolBuildCtx: input.toolBuildCtx,
        matchedCategoryIds,
      });

      const intentOutput: Record<string, unknown> = {
        intentClear: true,
        matchedCategoryIds,
        includeUncategorized: false,
        toolsBeforeIntentNarrow: input.tools.length,
        toolsAfterIntentNarrow: narrowed.length,
        toolsAfterBindCap: scoped.scopedTools.length,
        recallSource: recallResult.source,
        scopeFromCache: scoped.fromCache,
        recallMatches: recallResult.matches.map((item) => ({
          id: item.id,
          label: item.label,
          score: Number(item.score.toFixed(4)),
          source: item.source,
        })),
      };
      if (scoped.fallbackReason) {
        intentOutput.fallback = true;
        intentOutput.fallbackReason = scoped.fallbackReason;
      }
      if (scoped.bindCap) {
        intentOutput.bindToolsCap = scoped.bindCap;
      }
      const intentStep: AgentRunStep = {
        step: idx,
        type: 'intent',
        output: this.normalizeJsonLike(intentOutput),
      };

      await this.updateRun(
        input.runId,
        [...state.steps, intentStep],
        0,
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: [...state.steps, intentStep],
        intentKind: 'task',
        scopedTools: scoped.scopedTools,
        scopedLangChainTools: scoped.scopedLangChainTools,
        scopedToolBundle: scoped.scopedToolBundle,
        scopedAllowedToolIds: scoped.scopedAllowedToolIds,
      };
    };

    // 节点2：主推理节点。基于当前 observation 决定“直接回答”或“发起 tool_calls”。
    const llm = async (state: AgentGraphState): Promise<AgentGraphState> => {
      let graphState = state;
      if (
        shouldSkipIntentNode() &&
        !graphState.steps.some((row) => row.type === 'intent')
      ) {
        this.emitThink(
          input.sessionId,
          input.runId,
          '正在处理你的请求…\n',
          'replace',
        );
        const idx = graphState.steps.length + 1;
        graphState = buildFullBindIntentState(
          graphState,
          idx,
          'few_tools_full_bind',
        );
        await this.updateRun(
          input.runId,
          graphState.steps,
          0,
          AgentRunStatus.running,
        );
      }
      const step = graphState.iteration + 1;
      try {
        const toolsForPrompt = graphState.scopedTools;
        const decision = await this.buildDecisionPrompt(
          input.promptMessages,
          toolsForPrompt,
          graphState.toolObservations,
          input.enableToolCall,
          promptScope,
        );
        const { messages: invokeMessages, trimMeta } = this.buildLlmInvokeMessages(
          input.promptMessages,
          graphState.toolObservations,
          input.latestUserMessage,
          decision.toolSchemaJson,
          decision.toolDecisionPrompt,
          input.messageTokenBudget,
        );
        const promptDebugFile = emitLlmPromptDebug(
          (message) => this.logger.log(message),
          {
            runId: input.runId,
            sessionId: input.sessionId,
            phase: 'decision',
            step,
            iteration: graphState.iteration,
            messageTokenBudget: input.messageTokenBudget,
            meta: {
              enableToolCall: input.enableToolCall,
              scopedToolCount: graphState.scopedTools.length,
              observationCount: graphState.toolObservations.length,
              estimatedTokens: trimMeta.estimatedTokensAfter,
            },
            messages: invokeMessages,
          },
        );
        if (promptDebugFile) {
          this.logger.log(
            `LLM decision prompt file runId=${input.runId} step=${step} path=${promptDebugFile}`,
          );
        } else if (isLlmPromptDebugEnabled()) {
          this.logger.warn(
            `LLM decision prompt debug file write failed runId=${input.runId} step=${step}`,
          );
        }
        const llmStartedAt = Date.now();
        const langChainInvokeMessages = invokeMessages.map((message) =>
          this.toLangChainInvokeMessage(message),
        );
        const { model } =
          await this.llmService.createLangChainChatModelForMessages(
            invokeMessages.map((message) => ({
              role: message.role as LlmChatMessage['role'],
              content: message.content,
              toolCallId: message.toolCallId,
            })),
          );
        const runnable = input.enableToolCall
          ? model.bindTools(graphState.scopedLangChainTools as unknown[])
          : model.bindTools([]);
        const aiMessage = await this.streamRunnableMessages(
          runnable as {
            stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
            invoke: (messages: unknown[]) => Promise<AIMessage>;
          },
          langChainInvokeMessages,
          input.sessionId,
          input.runId,
        );
        const responseMeta = aiMessage.response_metadata as
          | Record<string, unknown>
          | undefined;
        const toolCalls = input.enableToolCall
          ? this.extractToolCalls(aiMessage)
          : [];
        const llmText = this.extractAiMessageText(aiMessage).trim();
        recordLlmUsage(input.runMetrics, {
          messages: invokeMessages.map((message) => ({
            role: message.role as LlmChatMessage['role'],
            content: message.content,
          })),
          outputText: llmText,
          durationMs: Date.now() - llmStartedAt,
          model:
            typeof responseMeta?.model_name === 'string'
              ? responseMeta.model_name
              : undefined,
          responseMeta,
        });
        const steps = [
          ...graphState.steps,
          {
            step,
            type: 'llm' as const,
            output: this.normalizeJsonLike({
              content: llmText,
              toolCalls,
            }),
            meta: {
              model:
                typeof responseMeta?.model_name === 'string'
                  ? responseMeta.model_name
                  : undefined,
              prompt: decision.toolDecisionPrompt,
              toolSchema: decision.toolSchemaJson,
              observations: decision.observationsJson,
              agentPrompt: decision.agentPrompt ?? undefined,
              userRequest: input.latestUserMessage,
            },
          },
        ];
        await this.updateRun(input.runId, steps, step, AgentRunStatus.running);
        if (toolCalls.length > 0) {
          const lastToolRound = getLastToolRoundFromSteps(graphState.steps);
          if (areToolCallRoundsIdentical(toolCalls, lastToolRound)) {
            const observation = this.mergeObservationsForSummary(
              graphState.toolObservations,
            );
            if (observation) {
              const dedupeSteps = [
                ...steps.slice(0, -1),
                {
                  ...steps[steps.length - 1],
                  output: this.normalizeJsonLike({
                    content: llmText,
                    toolCalls,
                    duplicateToolCallsSkipped: true,
                  }),
                },
              ];
              await this.updateRun(
                input.runId,
                dedupeSteps,
                step,
                AgentRunStatus.running,
              );
              this.emitThink(
                input.sessionId,
                input.runId,
                '检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n',
                'append',
              );
              return {
                ...graphState,
                iteration: step,
                steps: dedupeSteps,
                pendingToolCalls: [],
                pendingSummaryObservation: observation,
              };
            }
          }
        }
        if (toolCalls.length === 0) {
          if (!llmText) {
            const emptyReply =
              '我这次没有拿到有效结果，请你换个问法，或补充更具体的条件后我再试一次。';
            this.logger.warn(
              `llm returned empty content and no toolCalls runId=${input.runId} step=${step} model=${
                typeof responseMeta?.model_name === 'string'
                  ? responseMeta.model_name
                  : 'unknown'
              }`,
            );
            return {
              ...graphState,
              iteration: step,
              steps,
              pendingToolCalls: [],
              finalOutput: emptyReply,
              status: AgentRunStatus.success,
              finished: true,
            };
          }
          const completion = this.resolveLlmCompletionAfterTools(
            input.latestUserMessage,
            llmText,
            graphState.toolObservations,
          );
          if (completion?.kind === 'text') {
            return {
              ...graphState,
              iteration: step,
              steps,
              pendingToolCalls: [],
              finalOutput: completion.finalOutput,
              status: AgentRunStatus.success,
              finished: true,
            };
          }
          if (completion?.kind === 'summarize') {
            return {
              ...graphState,
              iteration: step,
              steps,
              pendingToolCalls: [],
              pendingSummaryObservation: completion.observation,
            };
          }
          return {
            ...graphState,
            iteration: step,
            steps,
            pendingToolCalls: [],
            finalOutput: llmText,
            status: AgentRunStatus.success,
            finished: true,
          };
        }
        return {
          ...graphState,
          iteration: step,
          steps,
          // 交给 tools 节点执行（本轮可能包含多个调用）。
          pendingToolCalls: toolCalls,
        };
      } catch (error) {
        const userMessage = buildLlmFailureUserMessage(error);
        const code = resolveLlmFailureCode(error);
        this.logger.warn(
          `llm node failed runId=${input.runId} step=${step}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        const steps = [
          ...graphState.steps,
          {
            step,
            type: 'llm' as const,
            output: this.normalizeJsonLike({
              error: true,
              content: userMessage,
            }),
            meta: { code },
          },
        ];
        await this.updateRun(
          input.runId,
          steps,
          step,
          AgentRunStatus.success,
        );
        recordMachineCodeUsage(input.runMetrics, code);
        this.emitLlmReply(input.sessionId, input.runId, userMessage, {
          code,
          mode: 'full',
        });
        return {
          ...graphState,
          iteration: step,
          steps,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          finalOutput: userMessage,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
    };
    // 节点3：工具执行节点。并行执行同轮 tool_calls，统一汇总后回到 llm。
    const tools = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const nextSteps = [...state.steps];
      const observations = [...state.toolObservations];
      if (state.pendingToolCalls.length > 0) {
        const lastToolRound = getLastToolRoundFromSteps(state.steps);
        if (areToolCallRoundsIdentical(state.pendingToolCalls, lastToolRound)) {
          const observation = this.mergeObservationsForSummary(observations);
          this.emitThink(
            input.sessionId,
            input.runId,
            '检测到与上一轮完全相同的工具调用，强制汇总已有结果…\n',
            'append',
          );
          const skipSteps: AgentRunStep[] = state.pendingToolCalls.map(
            (toolCall) => ({
              step: state.iteration,
              type: 'tool',
              name: toolCall.name,
              input: toolCall.arguments,
              output: this.normalizeJsonLike({
                skipped: true,
                reason: 'duplicate_tool_call_round',
              }),
            }),
          );
          const mergedSteps = [...nextSteps, ...skipSteps];
          await this.updateRun(
            input.runId,
            mergedSteps,
            state.iteration,
            AgentRunStatus.running,
          );
          if (observation) {
            return {
              ...state,
              steps: mergedSteps,
              toolObservations: observations,
              pendingToolCalls: [],
              pendingSummaryObservation: observation,
            };
          }
          return {
            ...state,
            steps: mergedSteps,
            toolObservations: observations,
            pendingToolCalls: [],
            pendingSummaryObservation: null,
          };
        }
      }
      if (!input.confirmWrite) {
        const writeCalls = collectWriteConfirmationRequired(
          state.pendingToolCalls,
          state.scopedTools,
        );
        if (writeCalls.length > 0) {
          const message = buildWriteConfirmationUserMessage();
          await this.pendingWriteConfirmationStore.set({
            runId: input.runId,
            turnId: input.turnId,
            sessionId: input.sessionId,
            userId: input.userId,
            appClientId: input.appClientId,
            agentId: input.agentId,
            latestUserMessage: input.latestUserMessage,
            toolCalls: writeCalls,
            createdAt: new Date().toISOString(),
          });
          this.chatEvents.emit(input.sessionId, {
            event: 'message',
            payload: {
              source: 'agent-run',
              action: 'confirmation_required',
              runId: input.runId,
              turnId: input.turnId,
              message,
            },
          });
          this.emitLlmReply(input.sessionId, input.runId, message, {
            code: 'WRITE_CONFIRMATION_REQUIRED',
            mode: 'full',
          });
          if (input.runId != null) {
            this.runSseContentDelivered.add(
              this.thinkBufferKey(input.sessionId, input.runId),
            );
          }
          return {
            ...state,
            steps: nextSteps,
            pendingToolCalls: [],
            awaitingWriteConfirmation: true,
            finalOutput: message,
            status: AgentRunStatus.success,
            finished: true,
          };
        }
      }

      for (const toolCall of state.pendingToolCalls) {
        this.emitThink(
          input.sessionId,
          input.runId,
          `\n正在调用工具：${toolCall.name}\n`,
          'append',
        );
      }
      const langChainBundle =
        state.scopedToolBundle ??
        this.toolEngine.buildLangChainTools(state.scopedTools, {
          userId: input.userId,
          allowedToolIds: state.scopedAllowedToolIds,
        });
      const toolResults = await Promise.all(
        state.pendingToolCalls.map((toolCall) =>
          this.invokeToolSafely(
            langChainBundle,
            state.scopedTools,
            toolCall,
          ),
        ),
      );
      const projectedToolResults: Array<{
        name: string;
        input: Record<string, unknown>;
        latency: number;
        projected: ProjectedToolOutput;
      }> = [];

      for (let idx = 0; idx < toolResults.length; idx += 1) {
        const toolResult = toolResults[idx];
        const toolCall = state.pendingToolCalls[idx];
        const profile = state.toolProfilesByName[toolResult.name] ?? null;

        const projected = projectToolOutput(
          toolResult.output,
          input.latestUserMessage,
          profile,
        );
        projectedToolResults.push({
          name: toolResult.name,
          input: toolCall.arguments,
          latency: toolResult.latency,
          projected,
        });
        const llmPayload = formatObservationForLlm({
          toolName: toolResult.name,
          output: projected.data,
          fieldLabels: projected.fieldLabels,
        });
        const nextObservation: ToolObservation = {
          name: toolResult.name,
          output: projected.data,
          llmPayload,
          quality: this.assessObservationQuality(projected.data),
          fieldLabels: projected.fieldLabels,
          fieldDescriptions: projected.fieldDescriptions,
          enumLabelsByPath: projected.enumLabelsByPath,
        };
        const duplicateObservationIndex = observations.findIndex(
          (row) =>
            row.llmPayload != null &&
            isSameObservationPayload(row.llmPayload, llmPayload),
        );
        if (duplicateObservationIndex >= 0) {
          observations[duplicateObservationIndex] = nextObservation;
        } else {
          observations.push(nextObservation);
        }
        const quality = this.assessObservationQuality(projected.data);
        const toolCode = this.resolveToolStepCode(quality, projected.data);
        nextSteps.push({
          step: state.iteration,
          type: 'tool',
          name: toolResult.name,
          input: toolCall.arguments,
          output: this.normalizeJsonLike(projected.data),
          meta: { latency: toolResult.latency, quality, code: toolCode ?? undefined },
        });
        recordMachineCodeUsage(input.runMetrics, toolCode);
        recordToolUsage(input.runMetrics, {
          name: toolResult.name,
          latencyMs: toolResult.latency,
          quality,
        });
        const toolFailed = isAgentToolErrorObservation(toolResult.output);
        this.emitThink(
          input.sessionId,
          input.runId,
          toolFailed
            ? `工具 ${toolCall.name} 未能返回可用数据\n`
            : `工具 ${toolCall.name} 调用完成\n`,
          'append',
        );
      }

      await this.updateRun(
        input.runId,
        nextSteps,
        state.iteration,
        AgentRunStatus.running,
      );

      const failedObservation = observations.find((row) =>
        isAgentToolErrorObservation(row.output),
      );
      const shouldExpandOnce =
        !state.hasExpandedOnce &&
        state.iteration <= 1 &&
        state.scopedTools.length < input.tools.length &&
        state.pendingToolCalls.length === 1 &&
        this.isLowQualityToolObservation(observations[observations.length - 1]);
      if (shouldExpandOnce) {
        const allToolIds = input.tools.map((tool) => tool.id);
        const expandedBundle = this.toolEngine.buildLangChainTools(input.tools, {
          userId: input.userId,
          allowedToolIds: allToolIds,
        });
        const expandedStep: AgentRunStep = {
          step: state.iteration,
          type: 'intent',
          output: this.normalizeJsonLike({
            fallback: true,
            fallbackReason: 'low_quality_first_result_expand_once',
            toolsBeforeExpand: state.scopedTools.length,
            toolsAfterExpand: input.tools.length,
          }),
        };
        const expandedSteps = [...nextSteps, expandedStep];
        await this.updateRun(
          input.runId,
          expandedSteps,
          state.iteration,
          AgentRunStatus.running,
        );
        this.emitThink(
          input.sessionId,
          input.runId,
          '首轮结果信息不足，正在放宽工具范围再尝试一次…\n',
          'append',
        );
        return {
          ...state,
          steps: expandedSteps,
          toolObservations: observations,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          scopedTools: input.tools,
          scopedLangChainTools: expandedBundle.tools,
          scopedToolBundle: expandedBundle,
          scopedAllowedToolIds: allToolIds,
          hasExpandedOnce: true,
        };
      }
      if (
        failedObservation &&
        state.pendingToolCalls.length === 1 &&
        projectedToolResults.length === 1
      ) {
        const userHint =
          extractToolErrorUserHint(failedObservation.output) ??
          buildToolFailureUserMessage(failedObservation.output);
        this.emitLlmReply(
          input.sessionId,
          input.runId,
          userHint,
          {
            code:
              extractToolErrorCode(failedObservation.output) ??
              'TOOL_EMPTY_RESULT',
            mode: 'full',
          },
        );
        return {
          ...state,
          steps: nextSteps,
          toolObservations: observations,
          pendingToolCalls: [],
          pendingSummaryObservation: null,
          finalOutput: userHint,
          status: AgentRunStatus.success,
          finished: true,
        };
      }

      return {
        ...state,
        steps: nextSteps,
        // 一律回 llm：是否再调 tool、何时 summarize 由决策环 + resolveLlmCompletionAfterTools 决定。
        toolObservations: observations,
        pendingToolCalls: [],
        pendingSummaryObservation: null,
      };
    };
     // 节点4：汇总节点。将本轮工具执行结果汇总为最终答案。
    const summarize = async (
      state: AgentGraphState,
    ): Promise<AgentGraphState> => {
      if (!state.pendingSummaryObservation) {
        return state;
      }
      const toolErrorHint = extractToolErrorUserHint(
        state.pendingSummaryObservation.output,
      );
      if (toolErrorHint) {
        const errorBlocks = buildRuleBasedMessageBlocks({
          output: state.pendingSummaryObservation.output,
          userMessage: input.latestUserMessage,
          fieldLabels: {},
          toolErrorHint,
        });
        const stored = serializeMessageBlocksForStorage(errorBlocks);
        const summaryStep: AgentRunStep = {
          step: state.iteration + 1,
          type: 'summarize',
          name: state.pendingSummaryObservation.name,
          output: toolErrorHint,
        };
        const nextSteps = [...state.steps, summaryStep];
        await this.updateRun(
          input.runId,
          nextSteps,
          state.iteration,
          AgentRunStatus.success,
        );
        return {
          ...state,
          steps: nextSteps,
          pendingSummaryObservation: null,
          finalOutput: stored,
          status: AgentRunStatus.success,
          finished: true,
        };
      }
      const toolDef = state.scopedTools.find(
        (tool) => tool.name === state.pendingSummaryObservation?.name,
      );
      const summarized =
        state.pendingSummaryObservation.name === 'smalltalk'
          ? await this.summarizeSmallTalkMessage(
              input.latestUserMessage,
              input.promptMessages,
              input.sessionId,
              input.runId,
              promptScope,
            )
          : await this.summarizeToolOutputForUser(
              state.pendingSummaryObservation.name,
              toolDef?.description,
              input.latestUserMessage,
              state.pendingSummaryObservation.output,
              state.pendingSummaryObservation.fieldLabels ?? {},
              state.pendingSummaryObservation.fieldDescriptions ?? {},
              state.pendingSummaryObservation.enumLabelsByPath ?? {},
              input.promptMessages,
              input.sessionId,
              input.runId,
              promptScope,
            );
      if (!summarized || summarized.trim().length === 0) {
        return {
          ...state,
          pendingSummaryObservation: null,
        };
      }
      const summarizedBlocks = tryParseStoredMessageBlocks(summarized);
      const stepPlain =
        summarizedBlocks && summarizedBlocks.length > 0
          ? messageBlocksToPlainText(summarizedBlocks)
          : summarized;
      const summaryStep: AgentRunStep = {
        step: state.iteration + 1,
        type: 'summarize',
        name: state.pendingSummaryObservation.name,
        output: stepPlain,
      };
      const nextSteps = [...state.steps, summaryStep];
      await this.updateRun(
        input.runId,
        nextSteps,
        state.iteration,
        AgentRunStatus.running,
      );
      return {
        ...state,
        steps: nextSteps,
        pendingSummaryObservation: null,
        finalOutput: summarized,
        status: AgentRunStatus.success,
        finished: true,
      };
    };
    // 图路由：
    // START -> preCheck -> intent|llm -> llm -> tools -> llm ...
    // 可用工具 < INTENT_FULL_BIND_TOOL_THRESHOLD 时 preCheck 直连 llm（全量 bindTools）。
    // 任一节点置 finished=true 或达到 maxSteps 时终止。
    const graph = new StateGraph(State)
      .addNode('intent', intent)
      .addNode('llm', llm)
      .addNode('tools', tools)
      .addNode('summarize', summarize)
      .addNode('preCheck', preCheck)
      .addEdge(START, 'preCheck')
      .addConditionalEdges('preCheck', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (s.pendingSummaryObservation) {
          return 'summarize';
        }
        if (shouldSkipIntentNode()) {
          return 'llm';
        }
        return 'intent';
      })
      .addConditionalEdges('intent', (s: AgentGraphState) => {
        if (s.finished) {
          return END;
        }
        if (s.pendingSummaryObservation) {
          return 'summarize';
        }
        return 'llm';
      })
      .addConditionalEdges('llm', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (state.pendingSummaryObservation) {
          return 'summarize';
        }
        return 'tools';
      })
      .addConditionalEdges('tools', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        if (state.pendingSummaryObservation) {
          return 'summarize';
        }
        if (state.iteration >= input.maxSteps) {
          return END;
        }
        return 'llm';
      })
      .addConditionalEdges('summarize', (state: AgentGraphState) => {
        if (state.finished) {
          return END;
        }
        return 'llm';
      });
    const app = graph.compile();
    return app.invoke({
      iteration: 0,
      steps: [],
      toolObservations: [],
      pendingToolCalls: [],
      pendingSummaryObservation: null,
      intentKind: 'task',
      finalOutput: '',
      status: AgentRunStatus.running,
      finished: false,
      scopedTools: input.tools,
      scopedLangChainTools: input.langChainTools.tools,
      scopedToolBundle: input.langChainTools,
      scopedAllowedToolIds: input.allowedToolIds,
      toolProfilesByName: input.toolProfilesByName,
      hasExpandedOnce: false,
    });
  }

  /** 判断工具观测是否“低质量”，用于触发一次性放宽重试。 */
  private isLowQualityToolObservation(observation: ToolObservation | undefined): boolean {
    if (!observation) {
      return true;
    }
    if (isAgentToolErrorObservation(observation.output)) {
      return true;
    }
    if (isEmptyListToolObservation(observation.output)) {
      return false;
    }
    const output = observation.output;
    if (output == null) {
      return true;
    }
    if (typeof output === 'string') {
      return output.trim().length === 0;
    }
    if (Array.isArray(output)) {
      return output.length === 0;
    }
    if (typeof output !== 'object') {
      return false;
    }
    const row = output as Record<string, unknown>;
    if (Object.keys(row).length === 0) {
      return true;
    }
    const data = row['data'];
    if (Array.isArray(data) && data.length === 0) {
      return false;
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data as Record<string, unknown>).length === 0;
    }
    return false;
  }

  /** 工具 observation 质量评估：用于运行统计和后续回退策略。 */
  private assessObservationQuality(output: unknown): 'high' | 'medium' | 'low' {
    if (isAgentToolErrorObservation(output)) {
      return 'low';
    }
    if (output == null) {
      return 'low';
    }
    if (typeof output === 'string') {
      const text = output.trim();
      if (!text) {
        return 'low';
      }
      return text.length >= 12 ? 'medium' : 'low';
    }
    if (typeof output === 'number' || typeof output === 'boolean') {
      return 'low';
    }
    if (Array.isArray(output)) {
      if (output.length === 0) {
        return 'low';
      }
      const first = output[0];
      if (!first || typeof first !== 'object' || Array.isArray(first)) {
        return 'medium';
      }
      return this.hasBusinessKeySignal(first as Record<string, unknown>)
        ? 'high'
        : 'medium';
    }
    if (typeof output !== 'object') {
      return 'low';
    }
    const row = output as Record<string, unknown>;
    if (Object.keys(row).length === 0) {
      return 'low';
    }
    const data = row['data'];
    if (Array.isArray(data) && data.length === 0) {
      return 'medium';
    }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const dataRow = data as Record<string, unknown>;
      if (Object.keys(dataRow).length === 0) {
        return 'low';
      }
      if (this.hasBusinessKeySignal(dataRow)) {
        return 'high';
      }
      return 'medium';
    }
    if (this.hasBusinessKeySignal(row)) {
      return 'high';
    }
    return 'medium';
  }

  private hasBusinessKeySignal(row: Record<string, unknown>): boolean {
    const businessKeys = [
      'id',
      'name',
      'title',
      'status',
      'code',
      'total',
      'items',
      'records',
      'list',
    ];
    const keys = Object.keys(row);
    const keyHit = keys.some((key) =>
      businessKeys.some((hint) => key.toLowerCase().includes(hint)),
    );
    if (!keyHit) {
      return false;
    }
    return keys.some((key) => {
      const value = row[key];
      if (value == null) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).length > 0;
      }
      return true;
    });
  }

  private resolveToolStepCode(
    quality: 'high' | 'medium' | 'low',
    output: unknown,
  ): AgentMachineCode | null {
    if (isAgentToolErrorObservation(output)) {
      return extractToolErrorCode(output);
    }
    if (isEmptyListToolObservation(output)) {
      return null;
    }
    if (quality === 'low') {
      return 'TOOL_EMPTY_RESULT';
    }
    return null;
  }

  private extractAiMessageText(message: AIMessage): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((item) =>
          item && typeof item === 'object' && 'text' in item
            ? String(item.text ?? '')
            : '',
        )
        .join('');
    }
    return '';
  }

  /** 多笔 tool 观测合并为一条，供 summarize / 规则化 table 使用。 */
  private mergeObservationsForSummary(
    observations: ToolObservation[],
  ): ToolObservation | null {
    const usable = observations.filter(
      (row) =>
        row.output != null && !isAgentToolErrorObservation(row.output),
    );
    if (usable.length === 0) {
      return null;
    }
    if (usable.length === 1) {
      return usable[0];
    }
    const tail = usable[usable.length - 1];
    const rows = usable
      .map((row) => this.normalizeObservationToRecord(row.output))
      .filter((row): row is Record<string, unknown> => row != null);
    return {
      name: 'merged_tool_results',
      output: rows.length >= 2 ? rows : usable.map((row) => row.output),
      quality: 'high',
      fieldLabels: tail.fieldLabels,
      fieldDescriptions: tail.fieldDescriptions,
      enumLabelsByPath: tail.enumLabelsByPath,
    };
  }

  private normalizeObservationToRecord(
    output: unknown,
  ): Record<string, unknown> | null {
    if (output == null) {
      return null;
    }
    if (typeof output === 'object' && !Array.isArray(output)) {
      return output as Record<string, unknown>;
    }
    return null;
  }

  /**
   * llm 不再调工具时：有观测则合并 summarize；只读且模型已用文字答清、无需结构化块时用正文。
   */
  private resolveLlmCompletionAfterTools(
    userMessage: string,
    llmText: string,
    observations: ToolObservation[],
  ):
    | { kind: 'text'; finalOutput: string }
    | { kind: 'summarize'; observation: ToolObservation }
    | null {
    const merged = this.mergeObservationsForSummary(observations);
    if (!merged) {
      return null;
    }
    if (shouldPreferSummarizeOverObservedTools(llmText, observations)) {
      return { kind: 'summarize', observation: merged };
    }
    const ruleBlocks = buildRuleBasedMessageBlocks({
      output: merged.output,
      userMessage,
      fieldLabels: merged.fieldLabels ?? {},
    });
    const needsStructured = ruleBlocks.some(isStructuredMessageBlock);
    if (
      isLikelyReadOnlyQuestion(userMessage) &&
      llmText.trim().length > 0 &&
      !needsStructured
    ) {
      return { kind: 'text', finalOutput: llmText };
    }
    return { kind: 'summarize', observation: merged };
  }

  private pickObservationForFinalSummary(
    observations: ToolObservation[],
  ): ToolObservation | null {
    return this.mergeObservationsForSummary(observations);
  }

  private async summarizeSmallTalkMessage(
    userMessage: string,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const fallback = 'Hello! How can I help you?';
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          PROMPT_KEYS.AGENT_SUMMARIZE_SMALLTALK,
          scope,
        ),
      },
      { role: 'user', content: userMessage },
    ];
    try {
      const blocks = await this.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        [],
        fallback,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `smalltalk summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      const blocks = [textBlock(fallback)];
      this.emitMessageBlocks(sessionId, runId, blocks, {
        action: 'stream',
        mode: 'full',
      });
      return serializeMessageBlocksForStorage(blocks);
    }
  }

  private async summarizeToolOutputForUser(
    toolName: string,
    toolDescription: string | undefined,
    userMessage: string,
    output: unknown,
    fieldLabels: Record<string, string>,
    fieldDescriptions: Record<string, string>,
    enumLabelsByPath: Record<string, Record<string, string>>,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const fullDetail = isUserRequestingFullDetail(userMessage);
    const summarizeScenario = classifySummarizeScenario(userMessage);

    const serialized = this.stringifyForPrompt(output);
    const fieldLabelText = formatFieldLabelsForPrompt(
      fieldLabels,
      enumLabelsByPath,
      fieldDescriptions,
    );
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    const ruleBlocks = buildRuleBasedMessageBlocks({
      output,
      userMessage,
      fieldLabels,
    });
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          fullDetail
            ? PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL
            : summarizeScenario === 'action'
              ? PROMPT_KEYS.AGENT_SUMMARIZE_ACTION
              : PROMPT_KEYS.AGENT_SUMMARIZE_READ,
          scope,
        ),
      },
      {
        role: 'user',
        content: [
          `User request: ${userMessage}`,
          `Tool: ${toolName}`,
          toolDescription ? `Tool description: ${toolDescription}` : null,
          fieldLabelText ? `Field labels:\n${fieldLabelText}` : null,
          ruleBlocks.length > 0
            ? `Suggested rule-based blocks (avoid duplicating the same table): ${JSON.stringify(ruleBlocks)}`
            : null,
          `Tool result: ${serialized}`,
        ]
          .filter((line): line is string => line != null && line.length > 0)
          .join('\n'),
      },
    ];
    const fallbackPlainText = this.buildSummarizeFallbackPlainText(
      toolName,
      output,
      ruleBlocks,
    );

    try {
      const blocks = await this.streamSummarizeMessageBlocks(
        summarizeMessages,
        sessionId,
        runId,
        ruleBlocks,
        fallbackPlainText,
      );
      return serializeMessageBlocksForStorage(blocks);
    } catch (error) {
      this.logger.warn(
        `tool result summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const fallbackBlocks = mergeMessageBlocks(
      ruleBlocks,
      ensureAtLeastOneTextBlock([], fallbackPlainText),
    );
    return serializeMessageBlocksForStorage(fallbackBlocks);
  }

  /** LLM summarize failure fallback: rule blocks or raw payload — no locale-specific templates. */
  private buildSummarizeFallbackPlainText(
    toolName: string,
    output: unknown,
    ruleBlocks: MessageBlock[],
  ): string {
    if (ruleBlocks.length > 0) {
      const fromBlocks = messageBlocksToPlainText(ruleBlocks);
      if (fromBlocks.trim().length > 0) {
        return fromBlocks;
      }
    }
    if (typeof output === 'string') {
      const trimmed = output.trim();
      return trimmed.length > 0 ? trimmed : `[${toolName}] (empty result)`;
    }
    const serialized = this.stringifyForPrompt(output);
    return `[${toolName}]\n${serialized}`;
  }

  private async streamSummarizeMessageBlocks(
    messages: LlmChatMessage[],
    sessionId: string,
    runId: number,
    ruleBlocks: MessageBlock[],
    fallbackPlainText: string,
  ): Promise<MessageBlock[]> {
    const runKey = this.thinkBufferKey(sessionId, runId);
    const summarizeDebugFile = emitLlmPromptDebug(
      (message) => this.logger.log(message),
      {
        runId,
        sessionId,
        phase: 'summarize',
        messages,
        meta: { ruleBlockCount: ruleBlocks.length },
      },
    );
    if (summarizeDebugFile) {
      this.logger.log(
        `LLM summarize prompt file runId=${runId} path=${summarizeDebugFile}`,
      );
    }
    const { placeholders, patches } = planStructuredBlockStreaming(
      runId,
      ruleBlocks,
    );
    for (const placeholder of placeholders) {
      this.emitMessageBlocks(sessionId, runId, [placeholder], {
        action: 'stream',
        mode: 'full',
      });
    }

    let streamTextDeltas = !shouldBufferSummarizeLlmStream(ruleBlocks);
    let streamed = '';
    const result = await this.llmService.streamChat(
      {
        messages,
        tools: [],
      },
      {
        onDelta: (delta) => {
          if (!delta.contentDelta) {
            return;
          }
          streamed += delta.contentDelta;
          if (!streamTextDeltas) {
            return;
          }
          if (looksLikeBlocksJsonOutput(streamed)) {
            streamTextDeltas = false;
            return;
          }
          this.emitMessageBlocks(
            sessionId,
            runId,
            [textBlock(delta.contentDelta)],
            { mode: 'delta', action: 'stream' },
          );
        },
      },
    );
    const normalizedResultText = this.sanitizeFinalOutput(result.content ?? '');
    if (!streamed.trim() && normalizedResultText) {
      const streamMeta = result.streamMeta;
      if (streamMeta?.fellBackToInvoke) {
        this.logger.warn(
          `summarize stream fallback to invoke runId=${runId} model=${result.model}`,
        );
      } else {
        this.logger.warn(
          `summarize stream no delta runId=${runId} model=${result.model} emittedDeltaCount=${streamMeta?.emittedDeltaCount ?? 0}`,
        );
      }
    }

    const rawLlmText =
      streamed.trim() || normalizedResultText || fallbackPlainText;
    const parsedLlmBlocks = tryParseStoredMessageBlocks(
      stripMarkdownFenceForBlocksParse(rawLlmText),
    );
    const llmBlocksFromParse = parsedLlmBlocks
      ? filterLlmBlocksAvoidDuplicatingRule(ruleBlocks, parsedLlmBlocks)
      : [];

    for (const patch of patches) {
      this.emitBlockPatch(sessionId, runId, patch);
    }

    const textStreamedViaDelta =
      streamTextDeltas && streamed.trim().length > 0;

    if (llmBlocksFromParse.length > 0) {
      const structuredFromLlm = llmBlocksFromParse.filter(
        isStructuredMessageBlock,
      );
      const textFromLlm = llmBlocksFromParse.filter(
        (block) => block.type === 'text',
      );
      if (structuredFromLlm.length > 0) {
        this.emitMessageBlocks(sessionId, runId, structuredFromLlm, {
          action: 'stream',
          mode: 'full',
        });
      }
      if (textFromLlm.length > 0 && !textStreamedViaDelta) {
        this.emitMessageBlocks(sessionId, runId, textFromLlm, {
          action: 'stream',
          mode: 'full',
        });
      }
    } else if (!textStreamedViaDelta && rawLlmText.trim()) {
      if (!looksLikeBlocksJsonOutput(rawLlmText)) {
        this.emitMessageBlocks(
          sessionId,
          runId,
          [textBlock(rawLlmText, 'markdown')],
          {
            action: 'stream',
            mode: 'full',
          },
        );
      }
    }

    const llmBlocksForStorage =
      llmBlocksFromParse.length > 0
        ? llmBlocksFromParse
        : rawLlmText.trim() && !looksLikeBlocksJsonOutput(rawLlmText)
          ? [textBlock(rawLlmText, 'markdown')]
          : [];
    const merged = mergeMessageBlocks(
      ruleBlocks,
      ensureAtLeastOneTextBlock(llmBlocksForStorage, fallbackPlainText),
    );
    this.markRunSseContentDelivered(runKey, merged, {
      textStreamed:
        textStreamedViaDelta ||
        llmBlocksForStorage.some((block) => block.type === 'text'),
      structuredPatches: patches.length,
    });
    return merged;
  }

  private async invokeToolSafely(
    bundle: BuiltLangChainTools,
    scopedTools: AgentEngineTool[],
    toolCall: GraphToolCall,
  ): Promise<ToolExecutionResult> {
    const startedAt = Date.now();
    try {
      return await this.toolEngine.invokeLangChainTool(
        bundle,
        toolCall.name,
        toolCall.arguments,
      );
    } catch (error) {
      const def = scopedTools.find((tool) => tool.name === toolCall.name);
      this.logger.warn(
        `tool invoke failed name=${toolCall.name}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        toolId: def?.id ?? 0,
        name: toolCall.name,
        input: toolCall.arguments,
        output: buildToolErrorObservation(error),
        latency: Date.now() - startedAt,
      };
    }
  }

  private extractToolCalls(message: AIMessage): GraphToolCall[] {
    const value = (message.tool_calls ??
      message.additional_kwargs?.tool_calls ??
      []) as unknown[];
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return null;
        }
        const row = item as Record<string, unknown>;
        const directName = row.name;
        const directArgs = row.args;
        if (typeof directName === 'string') {
          return {
            name: directName,
            arguments: normalizeToolCallArgs(directArgs),
          };
        }
        const fn = row.function;
        if (!fn || typeof fn !== 'object' || Array.isArray(fn)) {
          return null;
        }
        const fnRow = fn as Record<string, unknown>;
        const name = fnRow.name;
        if (typeof name !== 'string') {
          return null;
        }
        return {
          name,
          arguments: normalizeToolCallArgs(fnRow.arguments),
        };
      })
      .filter((item) => item !== null) as GraphToolCall[];
  }
}
