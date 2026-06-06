import { Injectable, NotFoundException } from '@nestjs/common';
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
import { AgentRunSseEmitter } from './main/agent-run-sse.emitter';
import { AgentSessionScopeService } from './main/agent-session-scope.service';
import {
  buildEngineToolsFromAllowed,
  executePendingWriteToolCalls,
  maxStepFromSteps,
} from './main/agent-tool-runtime.util';
import { deserializePendingObservations } from './agent-write-confirmation.util';

/**
 * Agent 运行编排：新消息走 run()，写确认续跑走 resumeAfterWriteConfirm()。
 * LangGraph / SSE / 会话工具缓存 / 落库收尾 见 engine/main/。
 */
@Injectable()
export class AgentEngineService {
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
    const { observations: writeObservations, steps: writeSteps } =
      await executePendingWriteToolCalls({
        latestUserMessage: consumed.latestUserMessage,
        toolCalls: consumed.toolCalls,
        tools,
        langChainBundle: scopedToolBundle,
        afterStep: contextMaxStep,
        toolEngine: this.toolEngine,
        assessObservationQuality: (output) =>
          this.langGraphRunner.assessObservationQualityForResume(output),
      });

    if (writeObservations.length === 0) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
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

    const runMetrics = createRunMetricsAccumulator();
    this.sse.resetThinkBuffer(input.sessionId, resumeRun.id);

    const priorObservations = deserializePendingObservations(
      consumed.resumeContext.toolObservations,
    );
    const mergedSteps = [...contextSteps, ...writeSteps];
    const iterationAfterWrites = maxStepFromSteps(mergedSteps);
    const graphInitialState: Partial<AgentGraphState> = {
      iteration: iterationAfterWrites,
      steps: mergedSteps,
      toolObservations: [...priorObservations, ...writeObservations],
      pendingToolCalls: [],
      pendingSummaryObservation: null,
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
        resumeFromLlm: true,
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
      return this.handleRunFailure({
        error,
        sessionId: input.sessionId,
        turnId: primaryRun.turnId,
        runId: resumeRun.id,
        runMetrics,
        scopedToolCount: tools.length,
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
      return this.handleRunFailure({
        error,
        sessionId: input.sessionId,
        turnId: turn.id,
        runId: run.id,
        runMetrics,
        scopedToolCount: tools.length,
        scheduleMemory: {
          userInput: input.input,
          finalOutput: '',
          toolObservations: [],
        },
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
    scheduleMemory?: {
      userInput: string;
      finalOutput: string;
      toolObservations: AgentGraphState['toolObservations'];
    };
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
      this.lifecycle.schedulePostRunMemoryTasks(input.sessionId, {
        userInput: input.scheduleMemory.userInput,
        finalOutput: input.scheduleMemory.finalOutput || finalOutput,
        toolObservations: input.scheduleMemory.toolObservations,
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
