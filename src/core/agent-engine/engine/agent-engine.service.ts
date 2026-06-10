import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AgentRunRole,
  AgentRunStatus,
} from '../../../../generated/prisma/client';
import { LlmService } from '../../llm/llm.service';
import { PromptComposerService } from '../../prompt/prompt-composer.service';
import { ToolEngineService } from '../../tool-engine/tool-engine.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatEventsService } from '../../../modules/chat/chat-events.service';
import { PendingWriteConfirmationStore } from '../../../modules/chat/pending-write-confirmation.store';
import { AgentService } from '../../../modules/agent/agent.service';
import {
  createRunMetricsAccumulator,
  recordMachineCodeUsage,
  resolveFinishReason,
} from './run-metrics.util';
import {
  resolveAgentRunFailureCode,
  resolveAgentRunFailureUserMessage,
} from './agent-run-user-messages.util';
import type {
  AgentGraphState,
  AgentRunInput,
  AgentRunResult,
  AgentRunStep,
  ResumeAfterWriteConfirmInput,
} from './main/agent-engine.types';
import { AgentLangGraphRunner } from './main/agent-lang-graph.runner';
import { AgentRunLifecycleService } from './main/agent-run-lifecycle.service';
import { SessionGoaService } from '../../memory/goa/session-goa.service';
import type { SessionMemoryUpdateContext } from '../../memory/goa/session-goa.types';
import { AgentRunSseEmitter } from './main/agent-run-sse.emitter';
import { AgentSessionScopeService } from './main/agent-session-scope.service';
import {
  buildEngineToolsFromAllowed,
  executePendingWriteToolCalls,
  maxStepFromSteps,
} from './main/agent-tool-runtime.util';
import { deserializePendingObservations } from './agent-write-confirmation.util';
import { resolveTaskPlanAdvance } from './main/task-plan.util';
import { buildWriteConfirmResumeSummaryObservation } from './write-confirm-resume-summary.util';
import type { ToolObservation } from './main/agent-engine.types';

/**
 * Agent 运行编排：新消息走 run()，写确认续跑走 resumeAfterWriteConfirm()。
 * LangGraph / SSE / 会话工具缓存 / 落库收尾 见 engine/main/。
 */
@Injectable()
export class AgentEngineService {
  private readonly logger = new Logger(AgentEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llmService: LlmService,
    private readonly promptComposer: PromptComposerService,
    private readonly toolEngine: ToolEngineService,
    private readonly chatEvents: ChatEventsService,
    private readonly agentService: AgentService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly sse: AgentRunSseEmitter,
    private readonly lifecycle: AgentRunLifecycleService,
    private readonly langGraphRunner: AgentLangGraphRunner,
    private readonly sessionScope: AgentSessionScopeService,
    private readonly goaService: SessionGoaService,
  ) {}

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

  async resumeAfterWriteConfirm(
    input: ResumeAfterWriteConfirmInput,
  ): Promise<AgentRunResult | null> {
    const session = await this.prisma.session.findFirst({
      where: { id: input.sessionId, userId: input.userId },
      select: { id: true, agentId: true, appClientId: true },
    });
    if (!session?.agentId) {
      return null;
    }

    const pending = await this.pendingWriteConfirmationStore.get(
      input.sessionId,
      input.userId,
    );
    if (!pending) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    const primaryRun = await this.prisma.agentRun.findFirst({
      where: {
        id: pending.runId,
        sessionId: pending.sessionId,
        userId: input.userId,
      },
      select: { id: true, turnId: true },
    });
    if (!primaryRun?.turnId) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    const agent = await this.agentService.getRuntimeAgent(
      session.appClientId,
      session.agentId,
    );
    if (!agent) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    const consumed = await this.pendingWriteConfirmationStore.consume(
      input.sessionId,
      input.userId,
    );
    if (!consumed || consumed.runId !== pending.runId) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    const [allowedTools, messageTokenBudget, prompt, runCount] =
      await Promise.all([
        this.agentService.getAllowedTools(
          session.agentId,
          input.userId,
          session.appClientId,
        ),
        this.llmService.getMessageTokenBudget(),
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
        this.prisma.agentRun.count({ where: { turnId: primaryRun.turnId } }),
      ]);

    const {
      tools,
      toolProfilesByName,
      allowedToolIds,
      langChainTools,
      toolBuildCtx,
    } = buildEngineToolsFromAllowed(
      allowedTools,
      input.userId,
      this.toolEngine,
    );

    const scopedIdSet = new Set(consumed.resumeContext.scopedToolIds);
    const resolvedScopedTools =
      tools.filter((tool) => scopedIdSet.has(tool.id)).length > 0
        ? tools.filter((tool) => scopedIdSet.has(tool.id))
        : tools;
    const scopedAllowedToolIds = resolvedScopedTools.map((tool) => tool.id);
    const scopedToolBundle = this.toolEngine.buildLangChainTools(
      resolvedScopedTools,
      { ...toolBuildCtx, allowedToolIds: scopedAllowedToolIds },
    );

    const approvedWriteToolNames = consumed.toolCalls.map((call) => call.name);
    const contextSteps = consumed.resumeContext.steps as AgentRunStep[];
    const contextMaxStep = maxStepFromSteps(contextSteps);
    let priorObservations = deserializePendingObservations(
      consumed.resumeContext.toolObservations,
    );
    if (priorObservations.length === 0) {
      const goa = await this.goaService.ensurePayload(input.sessionId);
      priorObservations = this.goaService
        .buildPriorToolObservationsForGraph(goa)
        .map((row) => ({
          name: row.name,
          output: row.output,
        }));
    }
    const startedAt = new Date();
    const resumeRun = await this.prisma.agentRun.create({
      data: {
        turnId: primaryRun.turnId,
        agentId: agent.id,
        appClientId: session.appClientId,
        sessionId: session.id,
        userId: input.userId,
        role: AgentRunRole.worker,
        sequence: runCount + 1,
        input: consumed.latestUserMessage,
        status: AgentRunStatus.running,
        steps: [],
        currentStep: 0,
        maxSteps: agent.maxSteps,
        startedAt,
      },
    });

    const {
      observations: writeObservations,
      steps: writeSteps,
      lastToolRoundMeta: writeRoundMeta,
    } = await executePendingWriteToolCalls({
      latestUserMessage: consumed.latestUserMessage,
      toolCalls: consumed.toolCalls,
      tools: resolvedScopedTools,
      langChainBundle: scopedToolBundle,
      afterStep: contextMaxStep,
      priorObservations,
      toolEngine: this.toolEngine,
      assessObservationQuality: (output, agentMetadata) =>
        this.langGraphRunner.assessObservationQualityForResume(
          output,
          agentMetadata,
        ),
      runId: resumeRun.id,
      sessionId: input.sessionId,
      onToolDebugLog: (message) => this.logger.log(message),
    });

    if (writeObservations.length === 0) {
      await this.lifecycle.updateRun(resumeRun.id, [], 0, AgentRunStatus.failed);
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    await this.lifecycle.updateRun(
      resumeRun.id,
      writeSteps,
      maxStepFromSteps(writeSteps),
      AgentRunStatus.running,
    );

    const runMetrics = createRunMetricsAccumulator();
    this.sse.resetThinkBuffer(input.sessionId, resumeRun.id);

    const iterationAfterWrites = maxStepFromSteps(
      writeSteps.length > 0 ? writeSteps : contextSteps,
    );
    const allObservations: ToolObservation[] = [
      ...priorObservations,
      ...writeObservations,
    ];
    let taskPlan = consumed.resumeContext.taskPlan ?? null;
    let pendingSummaryObservation: ToolObservation | null = null;

    if (writeRoundMeta.toolCalls.length > 0) {
      if (taskPlan) {
        const planAdvance = resolveTaskPlanAdvance({
          phase: 'post_tools',
          plan: taskPlan,
          observations: allObservations,
          executionStatuses: writeRoundMeta.executionStatuses,
          roundObservationIndices: writeRoundMeta.roundObservationIndices,
          scopedTools: resolvedScopedTools,
          toolCalls: writeRoundMeta.toolCalls,
        });
        if (planAdvance) {
          taskPlan = planAdvance.updatedPlan;
        }
      }

      pendingSummaryObservation = buildWriteConfirmResumeSummaryObservation({
        userMessage: consumed.latestUserMessage,
        writeRoundMeta,
        observations: allObservations,
        scopedTools: resolvedScopedTools,
      });
    }

    const graphInitialState: Partial<AgentGraphState> = {
      iteration: iterationAfterWrites,
      // worker run 只记录续跑新增步骤（写工具 + summarize），避免重复展示 primary 的 skill/plan/llm
      steps: writeSteps,
      preloadedToolObservations: priorObservations,
      toolObservations: writeObservations,
      pendingToolCalls: [],
      pendingSummaryObservation,
      lastToolRoundMeta: writeRoundMeta,
      intentKind: consumed.resumeContext.intentKind,
      scopedTools: resolvedScopedTools,
      scopedLangChainTools: scopedToolBundle.tools,
      scopedToolBundle,
      scopedAllowedToolIds,
      toolProfilesByName,
      hasExpandedOnce: consumed.resumeContext.hasExpandedOnce,
      skillApplied: consumed.resumeContext.skillApplied === true,
      activeSkillId: consumed.resumeContext.activeSkillId ?? null,
      activeSkillPrompt: consumed.resumeContext.activeSkillPrompt ?? null,
      activeSkillName: consumed.resumeContext.activeSkillName ?? null,
      activeSkillDescription: consumed.resumeContext.activeSkillDescription ?? null,
      activeSkillConfig: consumed.resumeContext.activeSkillConfig ?? null,
      activeSkillRiskLevel: consumed.resumeContext.activeSkillRiskLevel ?? null,
      taskPlan,
      pagedListHttpUsed: consumed.resumeContext.pagedListHttpUsed ?? 0,
    };

    try {
      const graphState = await this.langGraphRunner.run({
        promptMessages: prompt.messages,
        latestUserMessage: consumed.latestUserMessage,
        sessionId: input.sessionId,
        runId: resumeRun.id,
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
        turnId: primaryRun.turnId,
        resumeFromWriteConfirm: true,
        graphInitialState,
        approvedWriteToolNames,
      });

      return await this.lifecycle.completeAgentRunFromGraph({
        sessionId: input.sessionId,
        turnId: primaryRun.turnId,
        runId: resumeRun.id,
        agent,
        tools,
        latestUserMessage: consumed.latestUserMessage,
        graphState,
        runMetrics,
      });
    } catch (error) {
      const partial = await this.prisma.agentRun.findUnique({
        where: { id: resumeRun.id },
        select: { steps: true },
      });
      const partialSteps = this.lifecycle.parseStepsFromRun(partial?.steps);
      return this.handleRunFailure({
        error,
        sessionId: input.sessionId,
        turnId: primaryRun.turnId,
        runId: resumeRun.id,
        runMetrics,
        scopedToolCount: tools.length,
        scheduleMemory: this.lifecycle.buildFailureMemoryContext({
          turnId: primaryRun.turnId,
          runId: resumeRun.id,
          userInput: consumed.latestUserMessage,
          finalOutput: '',
          steps: partialSteps,
        }),
      });
    } finally {
      this.sse.clearThinkBuffer(input.sessionId, resumeRun.id);
    }
  }

  async run(input: AgentRunInput): Promise<AgentRunResult | null> {
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
      this.sessionScope.getSessionAllowedTools(
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

    const {
      tools,
      toolProfilesByName,
      allowedToolIds,
      langChainTools,
      toolBuildCtx,
    } = buildEngineToolsFromAllowed(
      allowedTools,
      input.userId,
      this.toolEngine,
    );

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
    this.sse.resetThinkBuffer(input.sessionId, run.id);

    try {
      const graphState = await this.langGraphRunner.run({
        promptMessages: prompt.messages,
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
      });

      return await this.lifecycle.completeAgentRunFromGraph({
        sessionId: input.sessionId,
        turnId: turn.id,
        runId: run.id,
        agent,
        tools,
        latestUserMessage: input.input,
        graphState,
        runMetrics,
      });
    } catch (error) {
      const partial = await this.prisma.agentRun.findUnique({
        where: { id: run.id },
        select: { steps: true },
      });
      const partialSteps = this.lifecycle.parseStepsFromRun(partial?.steps);
      return this.handleRunFailure({
        error,
        sessionId: input.sessionId,
        turnId: turn.id,
        runId: run.id,
        runMetrics,
        scopedToolCount: tools.length,
        scheduleMemory: this.lifecycle.buildFailureMemoryContext({
          turnId: turn.id,
          runId: run.id,
          userInput: input.input,
          finalOutput: '',
          steps: partialSteps,
        }),
      });
    } finally {
      this.sse.clearThinkBuffer(input.sessionId, run.id);
    }
  }

  private async handleRunFailure(input: {
    error: unknown;
    sessionId: string;
    turnId: number;
    runId: number;
    runMetrics: ReturnType<typeof createRunMetricsAccumulator>;
    scopedToolCount: number;
    scheduleMemory?: SessionMemoryUpdateContext;
  }): Promise<AgentRunResult> {
    const errorText = input.error instanceof Error ? input.error.message : String(input.error);
    const userFacing = resolveAgentRunFailureUserMessage(input.error);
    const errorCode = resolveAgentRunFailureCode(input.error);
    if (!userFacing) {
      const finishReason = resolveFinishReason({
        status: AgentRunStatus.failed,
        steps: [],
        finishedEarly: false,
        error: errorText,
      });
      await this.lifecycle.finalizeRunAndTurn({
        turnId: input.turnId,
        runId: input.runId,
        runMetrics: input.runMetrics,
        finalOutput: '',
        status: AgentRunStatus.failed,
        finishReason,
        error: errorText,
        scopedToolCount: input.scopedToolCount,
        steps: [],
        currentStep: 0,
      });
      throw input.error;
    }
    const finalOutput = this.lifecycle.sanitizeFinalOutput(userFacing);
    recordMachineCodeUsage(input.runMetrics, errorCode);
    this.sse.emitLlmReply(input.sessionId, input.runId, finalOutput, {
      code: errorCode ?? undefined,
      mode: 'full',
    });
    this.sse.runSseContentDelivered.add(
      this.sse.thinkBufferKey(input.sessionId, input.runId),
    );
    const finishReason = resolveFinishReason({
      status: AgentRunStatus.success,
      steps: [],
      finishedEarly: false,
      error: errorText,
    });
    await this.lifecycle.finalizeRunAndTurn({
      turnId: input.turnId,
      runId: input.runId,
      runMetrics: input.runMetrics,
      finalOutput,
      status: AgentRunStatus.success,
      finishReason,
      scopedToolCount: input.scopedToolCount,
      steps: [],
      currentStep: 0,
    });
    if (input.scheduleMemory) {
      await this.lifecycle.awaitPostRunMemoryTasks(input.sessionId, {
        ...input.scheduleMemory,
        turnId: input.turnId,
        runId: input.runId,
        finalOutput: input.scheduleMemory.finalOutput || finalOutput,
        runStatus: 'failed',
      });
    }
    return {
      runId: input.runId,
      turnId: input.turnId,
      output: finalOutput,
      status: AgentRunStatus.success,
    };
  }
}
