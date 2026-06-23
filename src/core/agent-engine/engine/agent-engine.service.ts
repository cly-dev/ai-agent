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
import { HostToolService } from '../../../modules/host-tool/host-tool.service';
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
  ResumeAfterWriteConfirmInput,
} from './main/types/agent-engine.types';
import { AgentLangGraphRunner } from './main/runner/agent-lang-graph.runner';
import { AgentRunLifecycleService } from './main/run/agent-run-lifecycle.service';
import { SessionGoaService } from '../../memory/goa/session-goa.service';
import {
  buildHostActionSyncPayload,
  coalescePageContext,
  collectSuccessfulMutationIdentifierValues,
  dispatchHostActionSse,
  hasSuccessfulMutationStep,
  isPageContextAlignedWithSuccessfulMutations,
  type AgentChatPageContext,
} from '../../host-bridge';
import type { SessionMemoryUpdateContext } from '../../memory/goa/session-goa.types';
import { AgentRunSseEmitter } from './main/run/agent-run-sse.emitter';
import { RunAssistantArtifactStore } from './main/run/run-assistant-artifact.store';
import { RunAssistantMessagePersistService } from './main/run/run-assistant-message-persist.service';
import { AgentSessionScopeService } from './main/session/agent-session-scope.service';
import { RequestedSkillRunService } from './main/skill/requested-skill-run.service';
import {
  buildEngineToolsFromAllowed,
  executePendingWriteToolCalls,
} from './main/runtime/agent-tool-runtime.util';
import { maxRunStepNumber } from './main/run/agent-run-steps.util';
import { buildCompletionHostToolRunStep, buildHostToolRunStep } from './main/host-tool/host-tool-run-step.util';
import { deserializePendingObservations } from './agent-write-confirmation.util';
import { resolveTaskPlanAdvance } from './main/plan/task-plan.util';
import { buildWriteConfirmResumeSummaryObservation } from './write-confirm-resume-summary.util';
import { pendingRespondFromObservation } from './turn/turn-respond.util';
import type { ToolObservation } from './main/types/agent-engine.types';

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
    private readonly hostToolService: HostToolService,
    private readonly agentService: AgentService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly sse: AgentRunSseEmitter,
    private readonly assistantArtifact: RunAssistantArtifactStore,
    private readonly messagePersist: RunAssistantMessagePersistService,
    private readonly lifecycle: AgentRunLifecycleService,
    private readonly langGraphRunner: AgentLangGraphRunner,
    private readonly sessionScope: AgentSessionScopeService,
    private readonly goaService: SessionGoaService,
    private readonly requestedSkillRun: RequestedSkillRunService,
  ) {}

  /**
   * C 端发消息前：角色可见 + Skill Tool 与用户允许 Tool 有交集。
   */
  async assertRequestedSkillRunnable(input: {
    userId: number;
    appClientId: number;
    agentId: number;
    sessionId: string;
    skillId: number;
  }): Promise<void> {
    const allowedRows = await this.sessionScope.getSessionAllowedTools(
      input.sessionId,
      input.agentId,
      input.userId,
      input.appClientId,
    );
    const { tools } = buildEngineToolsFromAllowed(
      allowedRows,
      input.userId,
      this.toolEngine,
    );
    await this.requestedSkillRun.assertRunnableForMessage({
      userId: input.userId,
      appClientId: input.appClientId,
      agentId: input.agentId,
      skillId: input.skillId,
      allowedTools: tools,
    });
  }

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
    this.chatEvents.purgeWriteConfirmationGate(sessionId, pending.runId);
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
    if (pending.turnId != null) {
      await this.messagePersist.appendNoticeToTurnOutput({
        userId,
        sessionId,
        turnId: pending.turnId,
        noticeMarkdown: message,
      });
    }
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

  private emitAgentRunComplete(
    sessionId: string,
    result: AgentRunResult,
  ): void {
    this.chatEvents.emit(sessionId, {
      event: 'complete',
      payload: {
        source: 'agent-run',
        runId: result.runId,
        turnId: result.turnId,
        status: result.status,
      },
    });
  }

  private async emitRunCompletion(
    sessionId: string,
    result: AgentRunResult,
    graphState: AgentGraphState,
    pageContext: AgentChatPageContext | null,
    runtime: { appClientId: number; agentId: number },
  ): Promise<void> {
    const mutationSucceeded =
      result.status === AgentRunStatus.success &&
      !graphState.awaitingWriteConfirmation &&
      pageContext?.page?.trim() &&
      hasSuccessfulMutationStep(graphState.steps, graphState.scopedTools);

    if (mutationSucceeded) {
      const pageAligned = isPageContextAlignedWithSuccessfulMutations({
        pageContext,
        steps: graphState.steps,
        scopedTools: graphState.scopedTools,
      });
      if (!pageAligned) {
        const mutationIds = [
          ...collectSuccessfulMutationIdentifierValues({
            steps: graphState.steps,
            scopedTools: graphState.scopedTools,
          }),
        ];
        this.logger.log(
          `completion host_tool skipped: pageContext entity not aligned with mutation runId=${result.runId} page=${pageContext.page} entityId=${String(pageContext.entity?.id ?? '')} entityType=${String(pageContext.entity?.type ?? '')} mutationIds=${mutationIds.join(',') || 'none'}`,
        );
        const completionHostToolStep = buildHostToolRunStep({
          existingSteps: graphState.steps,
          status: 'completion_skipped',
          reason: 'agent_mutation_success',
          pageScope: pageContext.page,
          skipReason: 'page_context_entity_not_aligned_with_mutation',
          sseDispatched: false,
        });
        await this.lifecycle.updateRun(
          result.runId,
          [...graphState.steps, completionHostToolStep],
          result.status,
        );
        this.emitAgentRunComplete(sessionId, result);
        return;
      }
      const hostTools = await this.hostToolService.resolveCompletionHostTools({
        appClientId: runtime.appClientId,
        agentId: runtime.agentId,
        skillId: graphState.activeSkillId,
        pageContext,
      });
      const sseDispatched = hostTools.length > 0;
      if (sseDispatched) {
        dispatchHostActionSse(
          (sid, envelope) => this.chatEvents.emit(sid, envelope),
          sessionId,
          buildHostActionSyncPayload({
            pageContext,
            runId: result.runId,
            turnId: result.turnId,
            skillConfig: graphState.activeSkillConfig,
            hostTools,
          }),
        );
      }
      const completionHostToolStep = buildCompletionHostToolRunStep({
        existingSteps: graphState.steps,
        pageScope: pageContext.page,
        hostTools,
        sseDispatched,
      });
      const stepsWithHostTool = [...graphState.steps, completionHostToolStep];
      await this.lifecycle.updateRun(
        result.runId,
        stepsWithHostTool,
        result.status,
      );
    }
    this.emitAgentRunComplete(sessionId, result);
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
    this.chatEvents.purgeWriteConfirmationGate(
      input.sessionId,
      pending.runId,
    );

    const [allowedTools, messageTokenBudget, goaPayload, runCount] =
      await Promise.all([
        this.agentService.getAllowedTools(
          session.agentId,
          input.userId,
          session.appClientId,
        ),
        this.llmService.getMessageTokenBudget(),
        this.goaService.ensurePayload(input.sessionId),
        this.prisma.agentRun.count({ where: { turnId: primaryRun.turnId } }),
      ]);
    const resumePageContext = coalescePageContext(
      input.pageContext,
      consumed.resumeContext.pageContext,
      goaPayload.lastPageContext,
    );
    if (input.pageContext) {
      await this.goaService.syncHostPageContext(
        input.sessionId,
        input.pageContext,
      );
    }
    const prompt = await this.promptComposer.compose({
      userId: input.userId,
      sessionId: input.sessionId,
      latestUserMessage: consumed.latestUserMessage,
      agentSystemPrompt: agent.systemPrompt,
      sessionScope: {
        appClientId: session.appClientId,
        agentId: session.agentId,
      },
      pageContext: resumePageContext,
    });

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
      priorSteps: [],
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
      await this.lifecycle.updateRun(resumeRun.id, [], AgentRunStatus.failed);
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    await this.lifecycle.updateRun(
      resumeRun.id,
      writeSteps,
      AgentRunStatus.running,
    );

    const runMetrics = createRunMetricsAccumulator();
    this.assistantArtifact.reset(
      input.sessionId,
      resumeRun.id,
      primaryRun.turnId,
    );
    this.sse.clearThinkBuffer(input.sessionId, resumeRun.id);

    const iterationAfterWrites = maxRunStepNumber(writeSteps);
    const allObservations: ToolObservation[] = [
      ...priorObservations,
      ...writeObservations,
    ];
    let taskPlan = consumed.resumeContext.taskPlan ?? null;
    let pendingRespond: AgentGraphState['pendingRespond'] = null;

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

      const resumeSummaryObservation = buildWriteConfirmResumeSummaryObservation({
        userMessage: consumed.latestUserMessage,
        writeRoundMeta,
        observations: allObservations,
        scopedTools: resolvedScopedTools,
      });
      pendingRespond = resumeSummaryObservation
        ? pendingRespondFromObservation(resumeSummaryObservation)
        : null;
    }

    const graphInitialState: Partial<AgentGraphState> = {
      iteration: iterationAfterWrites,
      // worker run 只记录续跑新增步骤（写工具 + summarize），避免重复展示 primary 的 skill/plan/llm
      steps: writeSteps,
      preloadedToolObservations: priorObservations,
      toolObservations: writeObservations,
      pendingToolCalls: [],
      pendingRespond,
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
      confirmedPreviewSerialized:
        consumed.resumeContext.confirmedPreviewSerialized?.trim() ||
        (
          await this.prisma.agentRun.findUnique({
            where: { id: primaryRun.id },
            select: { output: true },
          })
        )?.output ||
        null,
      pageContext: resumePageContext,
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
        pageContext: resumePageContext,
      });

      const result = await this.lifecycle.completeAgentRunFromGraph({
        userId: input.userId,
        sessionId: input.sessionId,
        turnId: primaryRun.turnId,
        runId: resumeRun.id,
        agent,
        latestUserMessage: consumed.latestUserMessage,
        graphState,
        runMetrics,
      });
      await this.emitRunCompletion(
        input.sessionId,
        result,
        graphState,
        resumePageContext,
        {
          appClientId: session.appClientId,
          agentId: agent.id,
        },
      );
      return result;
    } catch (error) {
      const partial = await this.prisma.agentRun.findUnique({
        where: { id: resumeRun.id },
        select: { steps: true },
      });
      const partialSteps = this.lifecycle.parseStepsFromRun(partial?.steps);
      const result = await this.handleRunFailure({
        error,
        userId: input.userId,
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
      if (result) {
        this.emitAgentRunComplete(input.sessionId, result);
      }
      return result;
    } finally {
      this.sse.clearThinkBuffer(input.sessionId, resumeRun.id);
      this.assistantArtifact.clear(input.sessionId, resumeRun.id);
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

    const pageContext = await this.goaService.syncHostPageContext(
      input.sessionId,
      input.pageContext ?? null,
    );

    const prompt = await this.promptComposer.compose({
      userId: input.userId,
      sessionId: input.sessionId,
      latestUserMessage: input.input,
      agentSystemPrompt: agent.systemPrompt,
      sessionScope: {
        appClientId: session.appClientId,
        agentId: session.agentId,
      },
      pageContext,
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
    this.assistantArtifact.reset(input.sessionId, run.id, turn.id);
    this.sse.clearThinkBuffer(input.sessionId, run.id);

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
        requestedSkillId: input.requestedSkillId,
        pageContext,
      });

      const result = await this.lifecycle.completeAgentRunFromGraph({
        userId: input.userId,
        sessionId: input.sessionId,
        turnId: turn.id,
        runId: run.id,
        agent,
        latestUserMessage: input.input,
        graphState,
        runMetrics,
      });
      await this.emitRunCompletion(
        input.sessionId,
        result,
        graphState,
        pageContext,
        {
          appClientId: session.appClientId,
          agentId: agent.id,
        },
      );
      return result;
    } catch (error) {
      const partial = await this.prisma.agentRun.findUnique({
        where: { id: run.id },
        select: { steps: true },
      });
      const partialSteps = this.lifecycle.parseStepsFromRun(partial?.steps);
      const result = await this.handleRunFailure({
        error,
        userId: input.userId,
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
      if (result) {
        this.emitAgentRunComplete(input.sessionId, result);
      }
      return result;
    } finally {
      this.sse.clearThinkBuffer(input.sessionId, run.id);
      this.assistantArtifact.clear(input.sessionId, run.id);
    }
  }

  private async handleRunFailure(input: {
    error: unknown;
    userId: number;
    sessionId: string;
    turnId: number;
    runId: number;
    runMetrics: ReturnType<typeof createRunMetricsAccumulator>;
    scopedToolCount: number;
    scheduleMemory?: SessionMemoryUpdateContext;
  }): Promise<AgentRunResult | null> {
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
    const sanitizedUserFacing = this.lifecycle.sanitizeFinalOutput(userFacing);
    recordMachineCodeUsage(input.runMetrics, errorCode);
    this.sse.publishAssistantBlocks(input.sessionId, input.runId, [
      { type: 'text', content: sanitizedUserFacing, format: 'markdown' },
    ]);
    const result = await this.lifecycle.finishAgentRun({
      userId: input.userId,
      sessionId: input.sessionId,
      turnId: input.turnId,
      runId: input.runId,
      status: AgentRunStatus.success,
      steps: [],
      scopedToolCount: input.scopedToolCount,
      runMetrics: input.runMetrics,
      error: errorText,
    });
    if (input.scheduleMemory) {
      await this.lifecycle.awaitPostRunMemoryTasks(input.sessionId, {
        ...input.scheduleMemory,
        turnId: input.turnId,
        runId: input.runId,
        finalOutput: this.lifecycle.finalOutputPlainText(result.output),
        runStatus: 'failed',
      });
    }
    return result;
  }
}
