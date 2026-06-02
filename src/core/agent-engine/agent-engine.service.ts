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
import { AgentRunRole, AgentRunStatus } from '../../../generated/prisma/client';
import type { Prisma } from '../../../generated/prisma/client';
import { normalizeToolCallArgs } from '../llm/tool-call-args.util';
import { LlmService } from '../llm/llm.service';
import {
  trimMessagesToTokenBudget,
} from '../llm/message-token-budget.util';
import type { LlmChatMessage } from '../llm/llm.types';
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
  getAgentDetailReplySkipSummarizeMaxChars,
  getAgentSummarizeSmallTalkMaxTokens,
  getAgentSummarizeToolDetailMaxTokens,
  getAgentSummarizeToolMaxTokens,
} from './agent-engine.constants';
import { renderStructuredToolDetailReply } from './tool-detail-reply.util';
import { isUserRequestingFullDetail } from './user-response-style.util';
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
  resolveXShopIdFromUserMessage,
} from '../../common/integration-site.util';
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
import { AgentService } from '../../modules/agent/agent.service';
import { SessionHistoryCompressionService } from '../memory/session-history-compression.service';
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

type AgentRunInput = {
  userId: number;
  sessionId: string;
  input: string;
  /** 触发本轮的 user Message.id */
  userMessageId: number;
};

type AgentRunStepType = 'intent' | 'llm' | 'tool' | 'summarize';
type AgentRunStep = {
  step: number;
  type: AgentRunStepType;
  name?: string;
  input?: Record<string, unknown> | string;
  output?: Record<string, unknown> | string;
  meta?: {
    prompt?: string;
    model?: string;
    latency?: number;
    quality?: 'high' | 'medium' | 'low';
    code?: AgentMachineCode;
  };
};

/** 运行期 scoped 工具：含 HTTP 执行字段与 responseProfile，全程存于 graph state。 */
type AgentEngineTool = ToolExecutionDefinition & {
  toolCategoryId: number | null;
  responseProfile: unknown;
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

type AgentLlmRequestDebugRecord = {
  sessionId: string;
  runId: number;
  step: number;
  maxTokens: number;
  toolsCount: number;
  toolNames: string[];
  decisionPrompt: string;
  messages: Array<{ role: string; content: string }>;
};

type GraphToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

type ToolObservation = {
  name: string;
  output: unknown;
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
};

@Injectable()
export class AgentEngineService {
  private readonly logger = new Logger(AgentEngineService.name);
  /** SSE think 为 run 内累积全文；key = sessionId:runId */
  private readonly thinkBuffers = new Map<string, string>();
  /** run 步骤排查日志：runId -> 文件路径 */
  private readonly runStepsDebugFiles = new Map<number, string>();
  /** 已写入的 steps 数组下标，避免 updateRun 重复落盘 */
  private readonly runStepsDebugLoggedCount = new Map<number, number>();
  /** 日志文件中的「第 x 步」序号 */
  private readonly runStepsDebugSeq = new Map<number, number>();
  /** 闲聊关键词词库（来自独立文件）。 */
  private smallTalkHintsCache: string[] | null = null;

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
  ) {}

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

    const agent = await this.prisma.agent.findFirst({
      where: { id: session.agentId, appClientId: session.appClientId },
      select: {
        id: true,
        maxSteps: true,
        enableToolCall: true,
        config: true,
      },
    });
    if (!agent) {
      throw new NotFoundException(`agent ${session.agentId} not found`);
    }

    const allowedTools = await this.agentService.getAllowedTools(
      agent.id,
      input.userId,
      session.appClientId,
    );
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
      responseProfile: tool.responseProfile,
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

    const startedAt = new Date();
    const turn = await this.prisma.messageTurn.create({
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
    });

    // 创建运行记录，后续每个步骤会增量回写。
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
    const prompt = await this.promptComposer.compose({
      userId: input.userId,
      sessionId: input.sessionId,
      latestUserMessage: input.input,
    });
    const messageTokenBudget = await this.llmService.getMessageTokenBudget();
    const promptMessages = trimMessagesToTokenBudget(
      prompt.messages,
      messageTokenBudget,
    );
    this.writePromptDebugFile({
      sessionId: input.sessionId,
      runId: run.id,
      userId: input.userId,
      latestUserMessage: input.input,
      messageCount: promptMessages.length,
      messages: promptMessages,
    });
    this.initRunStepsDebugFile(input.sessionId, run.id, input.input);
    this.appendRunStepsDebugNote(
      run.id,
      '准备 Agent 运行',
      `tools=${tools.length}，promptMessages=${promptMessages.length}，maxSteps=${agent.maxSteps}，enableToolCall=${agent.enableToolCall}`,
    );

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
      });
      currentStep = graphState.iteration;
      status = graphState.status;
      finalOutput = graphState.finalOutput;
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

      await this.workingMemoryService.refreshFromAgentRun(input.sessionId, {
        userInput: input.input,
        finalOutput,
        toolObservations: graphState.toolObservations,
      });
      await this.sessionHistoryCompression.maybeCompressAfterTurn(
        input.sessionId,
      );

      this.chatEvents.emit(input.sessionId, {
        event: 'result',
        payload: {
          content: JSON.stringify({
            source: 'agent-run',
            action: 'final',
            runId: run.id,
            turnId: turn.id,
            output: finalOutput,
          }),
        },
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
      this.emitLlmReply(input.sessionId, finalOutput, errorCode ?? undefined);
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
      await this.workingMemoryService.refreshFromAgentRun(input.sessionId, {
        userInput: input.input,
        finalOutput,
        toolObservations: [],
      });
      this.chatEvents.emit(input.sessionId, {
        event: 'result',
        payload: {
          content: JSON.stringify({
            source: 'agent-run',
            action: 'final',
            runId: run.id,
            turnId: turn.id,
            output: finalOutput,
            code: errorCode ?? undefined,
          }),
        },
      });
      return { runId: run.id, turnId: turn.id, output: finalOutput, status };
    } finally {
      this.finalizeRunStepsDebugFile(run.id, {
        status,
        finalOutput,
        currentStep,
        error: runError,
      });
      this.clearThinkBuffer(input.sessionId, run.id);
    }
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
    this.syncRunStepsDebugFromSteps(runId, steps);
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
  }

  private clearThinkBuffer(sessionId: string, runId: number): void {
    this.thinkBuffers.delete(this.thinkBufferKey(sessionId, runId));
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

  /** LLM 有输出即通过 SSE result 推送给前端（累积全文，前端覆盖展示）。 */
  private emitLlmReply(
    sessionId: string,
    output: string,
    code?: AgentMachineCode,
  ): void {
    const text = this.sanitizeFinalOutput(output);
    if (!text) {
      return;
    }
    this.chatEvents.emit(sessionId, {
      event: 'result',
      payload: {
        content: JSON.stringify({
          source: 'agent-run',
          action: 'stream',
          output: text,
          code,
        }),
      },
    });
  }

  /** LangChain stream：每个 token 立即 emitLlmReply。 */
  private async streamRunnableMessages(
    runnable: {
      stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
      invoke: (messages: unknown[]) => Promise<AIMessage>;
    },
    messages: Array<{ role: string; content: string }>,
    sessionId: string,
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
          this.emitLlmReply(sessionId, streamedText);
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
        this.emitLlmReply(sessionId, text);
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
        this.emitLlmReply(sessionId, text);
      }
      return aiMessage;
    }
    if (streamedText) {
      return new AIMessage({ content: streamedText });
    }
    return new AIMessage({ content: '' });
  }

  /**
   * 非 production 默认写文件；production 仅当 AGENT_ENGINE_DEBUG=1/true；
   * 任一环境 AGENT_ENGINE_DEBUG=0/false 可关闭。
   */
  private isAgentPromptDebugFileEnabled(): boolean {
    const v = process.env.AGENT_ENGINE_DEBUG?.trim().toLowerCase();
    if (v === '0' || v === 'false' || v === 'off') {
      return false;
    }
    if (v === '1' || v === 'true' || v === 'on') {
      return true;
    }
    return process.env.NODE_ENV !== 'production';
  }

  private writePromptDebugFile(record: {
    sessionId: string;
    runId: number;
    userId: number;
    latestUserMessage: string;
    messageCount: number;
    messages: LlmChatMessage[];
  }): void {
    if (!this.isAgentPromptDebugFileEnabled()) {
      return;
    }
    try {
      const dir = this.resolveAgentEngineDebugDir(
        'prompt',
        record.sessionId,
        record.runId,
      );
      fs.mkdirSync(dir, { recursive: true });
      const sessionHint = record.sessionId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const file = path.join(
        dir,
        `${Date.now()}-run${record.runId}-${sessionHint}-prompt.json`,
      );
      const payload = {
        at: new Date().toISOString(),
        ...record,
      };
      fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
      this.logger.log(`agent prompt written to ${file}`);
    } catch (err) {
      this.logger.warn(
        `agent prompt debug file write failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** 记录“实际发送给 LLM 的请求体（近似）”，用于排查 max_tokens / 上下文问题。 */
  private writeLlmRequestDebugFile(record: AgentLlmRequestDebugRecord): void {
    if (!this.isAgentPromptDebugFileEnabled()) {
      return;
    }
    try {
      const dir = this.resolveAgentEngineDebugDir(
        'llm-request',
        record.sessionId,
        record.runId,
      );
      fs.mkdirSync(dir, { recursive: true });
      const sessionHint = record.sessionId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const file = path.join(
        dir,
        `${Date.now()}-run${record.runId}-step${record.step}-${sessionHint}-llm-request.json`,
      );
      const payload = {
        at: new Date().toISOString(),
        ...record,
      };
      fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
      this.logger.log(`agent llm request written to ${file}`);
    } catch (err) {
      this.logger.warn(
        `agent llm request debug file write failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private writeToolResultsDebugFile(record: {
    sessionId: string;
    runId: number;
    iteration: number;
    latestUserMessage: string;
    pendingToolCalls: GraphToolCall[];
    toolResults: Array<{
      toolId: number;
      name: string;
      input: Record<string, unknown>;
      output: unknown;
      latency: number;
    }>;
    /** responseProfile 裁剪后的结果，供 LLM / summarize 使用 */
    projectedToolResults: Array<{
      name: string;
      input: Record<string, unknown>;
      latency: number;
      projected: ProjectedToolOutput;
    }>;
    context: {
      userId: number;
      maxSteps: number;
      enableToolCall: boolean;
      scopedToolNames: string[];
    };
  }): void {
    if (!this.isAgentPromptDebugFileEnabled()) {
      return;
    }
    try {
      const dir = this.resolveAgentEngineDebugDir(
        'tool-result',
        record.sessionId,
        record.runId,
      );
      fs.mkdirSync(dir, { recursive: true });
      const sessionHint = record.sessionId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const file = path.join(
        dir,
        `${Date.now()}-run${record.runId}-step${record.iteration}-${sessionHint}-tool-result.json`,
      );
      const payload = {
        at: new Date().toISOString(),
        ...record,
      };
      fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
      this.logger.log(`agent tool results written to ${file}`);
      for (const row of record.projectedToolResults) {
        this.logger.debug(
          `tool result projected runId=${record.runId} tool=${row.name} data=${this.truncateRunStepDebugResult(
            JSON.stringify(row.projected.data),
          )}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `agent tool results debug file write failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private writeIntentRecallDebugFile(record: {
    sessionId: string;
    runId: number;
    step: number;
    userMessage: string;
    categoryCandidates: Array<{ id: number; label: string; description: string | null }>;
    recallResult: unknown;
  }): void {
    if (!this.isAgentPromptDebugFileEnabled()) {
      return;
    }
    try {
      const dir = this.resolveAgentEngineDebugDir(
        'intent-recall',
        record.sessionId,
        record.runId,
      );
      fs.mkdirSync(dir, { recursive: true });
      const sessionHint = record.sessionId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const file = path.join(
        dir,
        `${Date.now()}-run${record.runId}-step${record.step}-${sessionHint}-intent-recall.json`,
      );
      fs.writeFileSync(
        file,
        `${JSON.stringify(
          {
            at: new Date().toISOString(),
            ...record,
          },
          null,
          2,
        )}\n`,
        'utf-8',
      );
      this.logger.log(`agent intent recall written to ${file}`);
    } catch (err) {
      this.logger.warn(
        `agent intent recall debug file write failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private static readonly RUN_STEP_DEBUG_RESULT_MAX = 8000;

  private initRunStepsDebugFile(
    sessionId: string,
    runId: number,
    userInput: string,
  ): void {
    if (!this.isAgentPromptDebugFileEnabled()) {
      return;
    }
    try {
      const dir = this.resolveAgentEngineDebugDir('steps', sessionId, runId);
      fs.mkdirSync(dir, { recursive: true });
      const sessionHint = sessionId
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const file = path.join(
        dir,
        `${Date.now()}-run${runId}-${sessionHint}-steps.txt`,
      );
      const header = [
        'agent run steps debug',
        `at: ${new Date().toISOString()}`,
        `sessionId: ${sessionId}`,
        `runId: ${runId}`,
        `userInput: ${userInput}`,
        '---',
        '',
      ].join('\n');
      fs.writeFileSync(file, `${header}\n`, 'utf-8');
      this.runStepsDebugFiles.set(runId, file);
      this.runStepsDebugLoggedCount.set(runId, 0);
      this.runStepsDebugSeq.set(runId, 0);
      this.logger.log(`agent run steps debug: ${file}`);
    } catch (err) {
      this.logger.warn(
        `agent run steps debug init failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /**
   * agent-engine 调试文件目录分层：
   * logs/agent-engine/{prompt|steps|llm-request|tool-result}/YYYY-MM-DD/session-xxx/
   */
  private resolveAgentEngineDebugDir(
    type:
      | 'prompt'
      | 'steps'
      | 'llm-request'
      | 'intent-recall'
      | 'tool-result',
    sessionId: string,
    runId: number,
  ): string {
    const day = new Date().toISOString().slice(0, 10);
    const sessionHint = sessionId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return path.join(
      process.cwd(),
      'logs',
      'agent-engine',
      type,
      day,
      `session-${sessionHint}`,
      `run-${runId}`,
    );
  }

  private appendRunStepsDebugLine(runId: number, line: string): void {
    const file = this.runStepsDebugFiles.get(runId);
    if (!file) {
      return;
    }
    try {
      fs.appendFileSync(file, `${line}\n`, 'utf-8');
      this.logger.debug(`agent run step: ${line}`);
    } catch (err) {
      this.logger.warn(
        `agent run steps debug append failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  private nextRunStepsDebugSeq(runId: number): number {
    const seq = (this.runStepsDebugSeq.get(runId) ?? 0) + 1;
    this.runStepsDebugSeq.set(runId, seq);
    return seq;
  }

  private appendRunStepsDebugNote(
    runId: number,
    action: string,
    result: string,
    node = 'bootstrap',
  ): void {
    const seq = this.nextRunStepsDebugSeq(runId);
    this.appendRunStepsDebugLine(
      runId,
      `第${seq}步，节点=${node}，执行了${action}，结果${this.truncateRunStepDebugResult(result)}`,
    );
  }

  private syncRunStepsDebugFromSteps(
    runId: number,
    steps: AgentRunStep[],
  ): void {
    const logged = this.runStepsDebugLoggedCount.get(runId) ?? 0;
    for (let index = logged; index < steps.length; index += 1) {
      const seq = this.nextRunStepsDebugSeq(runId);
      this.appendRunStepsDebugLine(
        runId,
        this.formatRunStepDebugLine(seq, steps[index]),
      );
    }
    this.runStepsDebugLoggedCount.set(runId, steps.length);
  }

  private formatRunStepDebugLine(seq: number, step: AgentRunStep): string {
    const action = this.describeRunStepAction(step);
    const result = this.formatRunStepDebugResult(step);
    const node = this.resolveRunStepNode(step);
    return `第${seq}步，节点=${node}，执行了${action}，结果${result}`;
  }

  private describeRunStepAction(step: AgentRunStep): string {
    if (step.type === 'intent') {
      const output = step.output;
      if (
        output &&
        typeof output === 'object' &&
        !Array.isArray(output) &&
        output.skipped === true
      ) {
        return '意图识别（跳过）';
      }
      if (
        output &&
        typeof output === 'object' &&
        !Array.isArray(output) &&
        output.fallback === true
      ) {
        return '意图识别（失败降级）';
      }
      if (
        output &&
        typeof output === 'object' &&
        !Array.isArray(output) &&
        output.intentClear === false
      ) {
        return '意图识别（意图不明确）';
      }
      return '意图识别';
    }
    if (step.type === 'llm') {
      return `LLM 推理（图迭代 ${step.step}）`;
    }
    if (step.type === 'tool') {
      return `工具调用 ${step.name ?? 'unknown'}`;
    }
    if (step.type === 'summarize') {
      return '结果总结';
    }
    return step.type;
  }

  private resolveRunStepNode(step: AgentRunStep): string {
    if (step.type === 'intent') {
      return 'intent';
    }
    if (step.type === 'llm') {
      return 'llm';
    }
    if (step.type === 'tool') {
      return 'tools';
    }
    if (step.type === 'summarize') {
      return 'summarize';
    }
    return 'unknown';
  }

  private formatRunStepDebugResult(step: AgentRunStep): string {
    const parts: string[] = [];
    if (step.input !== undefined) {
      parts.push(`输入=${this.stringifyRunStepDebugValue(step.input)}`);
    }
    if (step.output !== undefined) {
      parts.push(`输出=${this.stringifyRunStepDebugValue(step.output)}`);
    }
    if (step.meta) {
      parts.push(`meta=${this.stringifyRunStepDebugValue(step.meta)}`);
    }
    return parts.length > 0
      ? this.truncateRunStepDebugResult(parts.join('；'))
      : '（无）';
  }

  private stringifyRunStepDebugValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private truncateRunStepDebugResult(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length <= AgentEngineService.RUN_STEP_DEBUG_RESULT_MAX) {
      return trimmed || '（空）';
    }
    return `${trimmed.slice(0, AgentEngineService.RUN_STEP_DEBUG_RESULT_MAX)}…（已截断，共 ${trimmed.length} 字符）`;
  }

  private finalizeRunStepsDebugFile(
    runId: number,
    summary: {
      status: AgentRunStatus;
      finalOutput: string;
      currentStep: number;
      error?: string;
    },
  ): void {
    if (!this.runStepsDebugFiles.has(runId)) {
      return;
    }
    const footer = [
      '---',
      `运行结束 status=${summary.status} currentStep=${summary.currentStep}`,
      summary.error
        ? `error=${this.truncateRunStepDebugResult(summary.error)}`
        : null,
      `finalOutput=${this.truncateRunStepDebugResult(summary.finalOutput)}`,
      '',
    ]
      .filter((line): line is string => line != null)
      .join('\n');
    this.appendRunStepsDebugLine(runId, footer);
    this.runStepsDebugFiles.delete(runId);
    this.runStepsDebugLoggedCount.delete(runId);
    this.runStepsDebugSeq.delete(runId);
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

  /** 主推理调用消息：会话历史 + 本轮 tool 观测 + 决策 system。 */
  private buildLlmInvokeMessages(
    promptMessages: LlmChatMessage[],
    observations: ToolObservation[],
    decisionPrompt: string,
    messageTokenBudget: number,
  ): Array<{ role: string; content: string }> {
    const messages: LlmChatMessage[] = promptMessages.map((item) => ({
      role: item.role,
      content: item.content,
    }));
    for (const observation of observations) {
      messages.push({
        role: 'user',
        content: this.buildToolObservationMessage(observation),
      });
    }
    messages.push({ role: 'system', content: decisionPrompt });
    return trimMessagesToTokenBudget(messages, messageTokenBudget).map(
      (item) => ({
        role: item.role,
        content: item.content,
      }),
    );
  }

  /** 每轮推理前拼接决策提示词（DB 模板 + 动态工具/观测）。 */
  private async buildDecisionPrompt(
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
    }>,
    observations: ToolObservation[],
    enableToolCall: boolean,
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const summarizedTools = this.summarizeToolsForDecisionPrompt(tools);
    const toolCallInstruction = enableToolCall
      ? 'If a tool is needed, use native tool_calls. If not needed, answer in message content.'
      : 'Tool calling is disabled. Reply directly in message content.';
    const base = await this.promptRegistry.render(
      PROMPT_KEYS.AGENT_DECISION_LOOP,
      scope,
      { toolCallInstruction },
    );
    return [
      base,
      `Available tools (compact): ${JSON.stringify(summarizedTools)}`,
      `Previous tool observations: ${this.serializeObservationsForPrompt(observations)}`,
    ].join('\n');
  }

  private buildToolObservationMessage(observation: ToolObservation): string {
    const parts = [`[tool_result:${observation.name}]`];
    const fieldLabelText = formatFieldLabelsForPrompt(
      observation.fieldLabels ?? {},
      observation.enumLabelsByPath ?? {},
      observation.fieldDescriptions ?? {},
    );
    if (fieldLabelText.trim()) {
      parts.push(`字段说明:\n${fieldLabelText}`);
    }
    parts.push(this.stringifyForPrompt(observation.output));
    return parts.join('\n');
  }

  private serializeObservationsForPrompt(observations: ToolObservation[]): string {
    const compact = observations.map((item) => ({
      name: item.name,
      fieldLabels: item.fieldLabels ?? {},
      output: this.stringifyForPrompt(item.output),
    }));
    return JSON.stringify(compact);
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

  private summarizeToolsForDecisionPrompt(
    tools: Array<{
      id: number;
      name: string;
      description: string;
      inputSchema: unknown;
    }>,
  ): Array<{
    name: string;
    description: string;
    requiredParams: string[];
  }> {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      requiredParams: this.extractRequiredParamNames(tool.inputSchema),
    }));
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

  /** 向量召回前的轻量规则：过短或无可读字符视为意图不明确。 */
  private isUserIntentClear(userMessage: string): boolean {
    const trimmed = userMessage.trim();
    if (trimmed.length < 2) {
      return false;
    }
    return /[\p{L}\p{N}]/u.test(trimmed);
  }

  private buildIntentClarificationGuidance(userMessage: string): string {
    const trimmed = userMessage.trim();
    if (trimmed.length === 0) {
      return '请先描述你的问题或希望完成的操作。';
    }
    return '你的描述还不够明确，请说明具体场景、对象或你希望完成的操作，我再继续处理。';
  }

  /** 在本轮可用工具拉取关联的 ToolCategory 说明，供向量召回使用。 */
  private async fetchToolCategoriesForAllowedTools(toolCategoryIds: number[]) {
    const uniq = Array.from(new Set(toolCategoryIds));
    if (uniq.length === 0) {
      return [];
    }
    return this.prisma.toolCategory.findMany({
      where: { id: { in: uniq } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true, description: true },
    });
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
    const fallbackBundle = () => {
      const scopedIds = tools.map((tool) => tool.id);
      const scopedToolBundle = this.toolEngine.buildLangChainTools(tools, {
        ...toolBuildCtx,
        allowedToolIds: scopedIds,
      });
      return {
        scopedTools: tools,
        scopedLangChainTools: scopedToolBundle.tools,
        scopedToolBundle,
        scopedAllowedToolIds: scopedIds,
      };
    };
    try {
      const bindRecall = await this.categoryIntentRecall.recallTopToolsForBind(
        tools.map((tool) => ({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          toolCategoryId: tool.toolCategoryId,
        })),
        userMessage,
        undefined,
        preferredCategoryIds,
      );
      const toolById = new Map(tools.map((tool) => [tool.id, tool]));
      const scopedTools = bindRecall.tools
        .map((row) => toolById.get(row.id))
        .filter((tool): tool is AgentEngineTool => tool != null);
      const effectiveTools =
        scopedTools.length > 0 ? scopedTools : tools;
      const scopedIds = effectiveTools.map((tool) => tool.id);
      const scopedToolBundle = this.toolEngine.buildLangChainTools(
        effectiveTools,
        {
          ...toolBuildCtx,
          allowedToolIds: scopedIds,
        },
      );
      const bindCap = bindRecall.capped
        ? {
            before: tools.length,
            after: effectiveTools.length,
            source: bindRecall.source,
            matches: bindRecall.matches.map((item) => ({
              id: item.id,
              name: item.name,
              score: Number(item.score.toFixed(4)),
              source: item.source,
            })),
          }
        : undefined;
      return {
        scopedTools: effectiveTools,
        scopedLangChainTools: scopedToolBundle.tools,
        scopedToolBundle,
        scopedAllowedToolIds: scopedIds,
        bindCap,
        fallbackReason:
          scopedTools.length === 0 ? 'bind_recall_empty' : undefined,
      };
    } catch (error) {
      this.logger.warn(
        `tool bind recall failed, use full tool set: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        ...fallbackBundle(),
        fallbackReason: 'bind_recall_error',
      };
    }
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
  }): Promise<AgentGraphState> {
    const promptScope = {
      appClientId: input.appClientId,
      agentId: input.agentId,
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
    });
    // 节点1：意图识别 + 工具收窄（按 toolCategory），必要时直接结束并返回引导语。
    const intent = async (state: AgentGraphState): Promise<AgentGraphState> => {
      const idx = state.steps.length + 1;
      const baseScopedTools = input.tools;
      const baseLcTools = input.langChainTools.tools;
      const baseIds = input.allowedToolIds;

      const skipRecognition = !input.enableToolCall || input.tools.length === 0;
      const intentKind = this.detectIntentKind(input.latestUserMessage);

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

      const intentClear = this.isUserIntentClear(input.latestUserMessage);
      if (!intentClear) {
        const guidance = this.buildIntentClarificationGuidance(
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
        this.emitLlmReply(input.sessionId, guidance);
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
        this.writeIntentRecallDebugFile({
          sessionId: input.sessionId,
          runId: input.runId,
          step: idx,
          userMessage: input.latestUserMessage,
          categoryCandidates: categories,
          recallResult,
        });
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
        const scoped = await this.scopeToolsForMainLoop(
          baseScopedTools,
          input.latestUserMessage,
          input.toolBuildCtx,
        );
        if (scoped.bindCap) {
          fallbackStep.output = this.normalizeJsonLike({
            error: message,
            fallback: true,
            fallbackReason: 'category_recall_error',
            bindToolsCap: scoped.bindCap,
            bindFallbackReason: scoped.fallbackReason,
          });
        }
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
      const scoped = await this.scopeToolsForMainLoop(
        narrowed,
        input.latestUserMessage,
        input.toolBuildCtx,
        matchedCategoryIds,
      );

      const intentOutput: Record<string, unknown> = {
        intentClear: true,
        matchedCategoryIds,
        includeUncategorized: false,
        toolsBeforeIntentNarrow: input.tools.length,
        toolsAfterIntentNarrow: narrowed.length,
        toolsAfterBindCap: scoped.scopedTools.length,
        recallSource: recallResult.source,
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
      const step = state.iteration + 1;
      try {
        const toolsForPrompt = state.scopedTools;
        const decisionPrompt = await this.buildDecisionPrompt(
          toolsForPrompt,
          state.toolObservations,
          input.enableToolCall,
          promptScope,
        );
        const invokeMessages = this.buildLlmInvokeMessages(
          input.promptMessages,
          state.toolObservations,
          decisionPrompt,
          input.messageTokenBudget,
        );
        const llmStartedAt = Date.now();
        const invocationMaxTokens =
          await this.llmService.resolveInvocationMaxTokens(
            invokeMessages.map((message) => ({
              role: message.role as LlmChatMessage['role'],
              content: message.content,
            })),
          );
        const model = await this.llmService.createLangChainChatModel({
          streaming: true,
          maxTokens: invocationMaxTokens,
        });
        this.writeLlmRequestDebugFile({
          sessionId: input.sessionId,
          runId: input.runId,
          step,
          maxTokens: invocationMaxTokens,
          toolsCount: toolsForPrompt.length,
          toolNames: toolsForPrompt.map((tool) => tool.name),
          decisionPrompt,
          messages: invokeMessages.map((message) => ({
            role: String(message.role),
            content: message.content,
          })),
        });
        const runnable = input.enableToolCall
          ? model.bindTools(state.scopedLangChainTools as unknown[])
          : model.bindTools([]);
        const aiMessage = await this.streamRunnableMessages(
          runnable as {
            stream: (messages: unknown[]) => Promise<AsyncIterable<unknown>>;
            invoke: (messages: unknown[]) => Promise<AIMessage>;
          },
          invokeMessages,
          input.sessionId,
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
          ...state.steps,
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
              prompt: decisionPrompt,
            },
          },
        ];
        await this.updateRun(input.runId, steps, step, AgentRunStatus.running);
        if (toolCalls.length === 0) {
          const summaryObservation = this.pickObservationForFinalSummary(
            state.toolObservations,
          );
          if (summaryObservation) {
            return {
              ...state,
              iteration: step,
              steps,
              pendingToolCalls: [],
              pendingSummaryObservation: summaryObservation,
            };
          }
          // 无 tool_calls 且无工具观测：本轮产出即最终答案，流程结束。
          return {
            ...state,
            iteration: step,
            steps,
            pendingToolCalls: [],
            finalOutput: llmText,
            status: AgentRunStatus.success,
            finished: true,
          };
        }
        return {
          ...state,
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
          ...state.steps,
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
        this.emitLlmReply(input.sessionId, userMessage, code);
        return {
          ...state,
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
      const workingMemory = await this.workingMemoryService.get(input.sessionId);
      const wmShopId = workingMemory?.entities?.xShopId;
      const toolResults = await Promise.all(
        state.pendingToolCalls.map((toolCall) =>
          this.invokeToolSafely(
            langChainBundle,
            state.scopedTools,
            toolCall,
            wmShopId,
            input.latestUserMessage,
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
          {
            sessionId: input.sessionId,
            runId: input.runId,
            toolName: toolResult.name,
            iteration: state.iteration,
          },
        );
        projectedToolResults.push({
          name: toolResult.name,
          input: toolCall.arguments,
          latency: toolResult.latency,
          projected,
        });
        observations.push({
          name: toolResult.name,
          output: projected.data,
          quality: this.assessObservationQuality(projected.data),
          fieldLabels: projected.fieldLabels,
          fieldDescriptions: projected.fieldDescriptions,
          enumLabelsByPath: projected.enumLabelsByPath,
        });
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
        await this.updateRun(
          input.runId,
          nextSteps,
          state.iteration,
          AgentRunStatus.running,
        );
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
      this.writeToolResultsDebugFile({
        sessionId: input.sessionId,
        runId: input.runId,
        iteration: state.iteration,
        latestUserMessage: input.latestUserMessage,
        pendingToolCalls: state.pendingToolCalls,
        toolResults,
        projectedToolResults,
        context: {
          userId: input.userId,
          maxSteps: input.maxSteps,
          enableToolCall: input.enableToolCall,
          scopedToolNames: state.scopedTools.map((tool) => tool.name),
        },
      });

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
          userHint,
          extractToolErrorCode(failedObservation.output) ?? 'TOOL_EMPTY_RESULT',
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

      const summaryObservation = this.pickObservationForAutoSummary(
        input.latestUserMessage,
        state.pendingToolCalls,
        observations,
      );
      return {
        ...state,
        steps: nextSteps,
        // 把工具结果沉淀为 observation，供下一轮 llm 决策使用。
        toolObservations: observations,
        pendingToolCalls: [],
        pendingSummaryObservation: summaryObservation,
      };
    };
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
        this.emitLlmReply(
          input.sessionId,
          toolErrorHint,
          extractToolErrorCode(state.pendingSummaryObservation.output) ??
            'TOOL_EMPTY_RESULT',
        );
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
          finalOutput: toolErrorHint,
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
              promptScope,
            );
      if (!summarized || summarized.trim().length === 0) {
        return {
          ...state,
          pendingSummaryObservation: null,
        };
      }
      const summaryStep: AgentRunStep = {
        step: state.iteration + 1,
        type: 'summarize',
        name: state.pendingSummaryObservation.name,
        output: summarized,
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
    // START -> intent -> llm -> tools -> llm ...
    // 任一节点置 finished=true 或达到 maxSteps 时终止。
    const graph = new StateGraph(State)
      .addNode('intent', intent)
      .addNode('llm', llm)
      .addNode('tools', tools)
      .addNode('summarize', summarize)
      .addEdge(START, 'intent')
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
      return true;
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
      return 'low';
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

  private pickObservationForFinalSummary(
    observations: ToolObservation[],
  ): ToolObservation | null {
    if (observations.length === 0) {
      return null;
    }
    const latest = observations[observations.length - 1];
    if (latest.output == null) {
      return null;
    }
    return latest;
  }

  private pickObservationForAutoSummary(
    userMessage: string,
    pendingToolCalls: GraphToolCall[],
    observations: ToolObservation[],
  ): ToolObservation | null {
    if (pendingToolCalls.length !== 1 || observations.length === 0) {
      return null;
    }
    if (!this.isLikelyReadOnlyQuestion(userMessage)) {
      return null;
    }
    const latest = observations[observations.length - 1];
    if (latest.output == null) {
      return null;
    }
    return latest;
  }

  private isLikelyReadOnlyQuestion(userMessage: string): boolean {
    const text = userMessage.trim().toLowerCase();
    if (!text) {
      return false;
    }
    const writeHints = [
      '修改',
      '更新',
      '创建',
      '新增',
      '删除',
      '批量',
      '上架',
      '下架',
      '回滚',
      'set',
      'update',
      'create',
      'delete',
      'rollback',
    ];
    if (writeHints.some((hint) => text.includes(hint))) {
      return false;
    }
    const readHints = [
      '查',
      '查询',
      '详情',
      '信息',
      '库存',
      '状态',
      '多少',
      '是什么',
      'get',
      'detail',
      'status',
      'inventory',
    ];
    return readHints.some((hint) => text.includes(hint));
  }

  private detectIntentKind(
    userMessage: string,
  ): 'task' | 'smalltalk' | 'unclear' {
    const text = userMessage.trim().toLowerCase();
    if (!text) {
      return 'unclear';
    }
    const taskHints = [
      '查',
      '查询',
      '详情',
      '库存',
      '状态',
      '修改',
      '更新',
      '创建',
      '删除',
      '商品',
      'tool',
      'api',
      'id',
    ];
    if (taskHints.some((hint) => text.includes(hint))) {
      return 'task';
    }
    const smallTalkHints = this.getSmallTalkHints();
    if (smallTalkHints.some((hint) => text.includes(hint))) {
      return 'smalltalk';
    }
    if (text.length <= 6) {
      return 'smalltalk';
    }
    return 'task';
  }

  private getSmallTalkHints(): string[] {
    if (this.smallTalkHintsCache) {
      return this.smallTalkHintsCache;
    }
    const file = path.join(
      process.cwd(),
      'src',
      'core',
      'intent',
      'smalltalk-hints.json',
    );
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw) as { hints?: unknown };
      const hints = Array.isArray(parsed?.hints)
        ? parsed.hints
            .map((item) =>
              typeof item === 'string' ? item.trim().toLowerCase() : '',
            )
            .filter((item) => item.length > 0)
        : [];
      this.smallTalkHintsCache = hints;
      return hints;
    } catch (error) {
      this.logger.warn(
        `smalltalk hints load failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.smallTalkHintsCache = [];
      return this.smallTalkHintsCache;
    }
  }

  private async summarizeSmallTalkMessage(
    userMessage: string,
    promptMessages: LlmChatMessage[],
    sessionId: string,
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const agentPrompts = promptMessages.filter(
      (message) =>
        message.role === 'system' && message.content.includes('<agent_prompt>'),
    );
    try {
      const content = await this.streamSummarizerResult(
        [
          ...agentPrompts,
          {
            role: 'system',
            content: await this.promptRegistry.render(
              PROMPT_KEYS.AGENT_SUMMARIZE_SMALLTALK,
              scope,
            ),
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        sessionId,
        0.7,
        getAgentSummarizeSmallTalkMaxTokens(),
      );
      if (content) {
        return content;
      }
    } catch (error) {
      this.logger.warn(
        `smalltalk summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    return '你好呀，我在这儿。你可以直接说你想查询或处理什么，我来帮你。';
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
    scope: { appClientId: number; agentId: number },
  ): Promise<string> {
    const fullDetail = isUserRequestingFullDetail(userMessage);

    if (fullDetail) {
      const direct = renderStructuredToolDetailReply(output, {
        toolName,
        fieldLabels,
        maxChars: getAgentDetailReplySkipSummarizeMaxChars(),
      });
      if (direct) {
        this.emitLlmReply(sessionId, direct);
        return direct;
      }
    }

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
    const summarizeMessages: LlmChatMessage[] = [
      ...agentPrompts,
      {
        role: 'system',
        content: await this.promptRegistry.render(
          fullDetail
            ? PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL
            : PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_BRIEF,
          scope,
        ),
      },
      {
        role: 'user',
        content: [
          `用户问题: ${userMessage}`,
          `工具名: ${toolName}`,
          toolDescription ? `工具说明: ${toolDescription}` : null,
          fieldLabelText ? `字段说明:\n${fieldLabelText}` : null,
          `工具结果: ${serialized}`,
        ]
          .filter((line): line is string => line != null && line.length > 0)
          .join('\n'),
      },
    ];
    try {
      const content = await this.streamSummarizerResult(
        summarizeMessages,
        sessionId,
        0,
        fullDetail
          ? getAgentSummarizeToolDetailMaxTokens()
          : getAgentSummarizeToolMaxTokens(),
      );
      if (content) {
        return content;
      }
    } catch (error) {
      this.logger.warn(
        `tool result summarize fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    if (typeof output === 'string') {
      const trimmed = output.trim();
      if (!trimmed) {
        return '';
      }
      return `已查询到结果（${toolName}）：\n${trimmed}`;
    }
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
      return `已查询到结果（${toolName}）：${JSON.stringify(output)}`;
    }
    const row = output as Record<string, unknown>;
    const lines: string[] = [];
    const id = this.pickString(row.id);
    const title = this.pickString(row.title);
    const brand = this.pickString(row.brand);
    const status = this.pickString(row.status);
    const shopId = this.pickString(row.shopId);
    const category = this.pickString(row.backCategory);
    const updatedAt = this.pickString(row.gmtModify);
    if (id) lines.push(`- 商品ID: ${id}`);
    if (title) lines.push(`- 标题: ${title}`);
    if (brand) lines.push(`- 品牌: ${brand}`);
    if (status) lines.push(`- 状态: ${status}`);
    if (shopId) lines.push(`- 站点店铺ID: ${shopId}`);
    if (category) lines.push(`- 类目: ${category}`);
    if (updatedAt) lines.push(`- 更新时间: ${updatedAt}`);

    const mediaCount = this.pickArrayCount(row.mediaAttributes);
    const seoCount = this.pickArrayCount(row.seoList);
    const logisticsCount = this.pickArrayCount(row.logisticsList);
    if (mediaCount != null) lines.push(`- 媒体数量: ${mediaCount}`);
    if (seoCount != null) lines.push(`- SEO条目数: ${seoCount}`);
    if (logisticsCount != null) lines.push(`- 物流配置数: ${logisticsCount}`);

    if (lines.length === 0) {
      const compact = JSON.stringify(row);
      return `已查询到结果（${toolName}）：${
        compact.length > 1200 ? `${compact.slice(0, 1200)}...(truncated)` : compact
      }`;
    }
    return [`已查询到商品详情（${toolName}）：`, ...lines].join('\n');
  }

  private async invokeToolSafely(
    bundle: BuiltLangChainTools,
    scopedTools: AgentEngineTool[],
    toolCall: GraphToolCall,
    wmShopId: unknown,
    userMessage: string,
  ): Promise<ToolExecutionResult> {
    const startedAt = Date.now();
    try {
      return await this.toolEngine.invokeLangChainTool(
        bundle,
        toolCall.name,
        this.mergeDefaultShopHeader(
          toolCall.arguments,
          wmShopId,
          userMessage,
        ),
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

  private mergeDefaultShopHeader(
    args: Record<string, unknown>,
    wmShopId: unknown,
    userMessage: string,
  ): Record<string, unknown> {
    if (args['X-SHOP-ID'] !== undefined && args['X-SHOP-ID'] !== null) {
      return args;
    }
    let shopId: number;
    if (wmShopId != null && String(wmShopId).trim() !== '') {
      shopId = Number(wmShopId);
    } else {
      shopId = resolveXShopIdFromUserMessage(userMessage);
    }
    if (!Number.isFinite(shopId)) {
      return args;
    }
    return { ...args, 'X-SHOP-ID': Math.trunc(shopId) };
  }

  private pickString(value: unknown): string | null {
    if (value == null) {
      return null;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }

  private pickArrayCount(value: unknown): number | null {
    return Array.isArray(value) ? value.length : null;
  }

  private async streamSummarizerResult(
    messages: LlmChatMessage[],
    sessionId: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    let streamed = '';
    await this.llmService.streamChat(
      {
        messages,
        tools: [],
        temperature,
        maxTokens,
      },
      {
        onDelta: (delta) => {
          if (!delta.contentDelta) {
            return;
          }
          streamed += delta.contentDelta;
          this.emitLlmReply(sessionId, streamed);
        },
      },
    );
    return streamed.trim();
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
