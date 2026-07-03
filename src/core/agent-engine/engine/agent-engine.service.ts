import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AgentRunRole,
  AgentRunStatus,
} from '../../../../generated/prisma/client';
import { LlmService } from '../../llm/llm.service';
import { PromptComposerService } from '../../prompt/prompt-composer.service';
import { ToolEngineService } from '../../tool-engine/tool-engine.service';
import { PrismaService } from '../../../prisma/prisma.service';
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
  ResumeAfterWriteGateInput,
} from './main/types/agent-engine.types';
import { normalizeDraftReviewDecision, canRequestDraftRetry, resolveDraftRetryBudget } from '../../draft-review';
import { AgentLangGraphRunner } from './main/runner/agent-lang-graph.runner';
import { AgentRunLifecycleService } from './main/run/agent-run-lifecycle.service';
import { SessionGoaService } from '../../memory/goa/session-goa.service';
import {
  buildHostToolStreamId,
  collectSuccessfulMutationIdentifierValues,
  dispatchHostActionInstant,
  hasSuccessfulMutationStep,
  isPageContextAlignedWithSuccessfulMutations,
  resolveHostToolPageScope,
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
} from './main/runtime/agent-tool-runtime.util';
import { maxRunStepNumber } from './main/run/agent-run-steps.util';
import { buildCompletionHostToolRunStep, buildHostToolRunStep } from './main/host-tool/host-tool-run-step.util';
import {
  AgentRunAbortedError,
  isAgentRunAbortedError,
} from '../../session-run/run-aborted.error';
import { AgentRunSseGateway } from '../../session-run/agent-run-sse.gateway';
import type { RunExecutionScope } from '../../session-run/run-execution.scope';
import {
  prepareWriteConfirmFromRedis,
  releaseWriteConfirmGate,
} from './write-confirm/prepare-write-confirm-resume.util';
import {
  buildWriteConfirmResumeDeps,
  runWriteConfirmResume,
} from './write-confirm/run-write-confirm-resume.util';
import { runWriteGateRetry } from './write-confirm/run-write-gate-retry.util';
import { validateWriteGateEditedToolCalls } from './write-confirm/validate-write-gate-edited-tool-calls.util';
import { WriteGateDecisionRejectedError } from './write-confirm/write-gate-decision.error';
import { appendChatWriteConfirmRejectedAuditToPrimaryRun } from '../../approval/write-confirm-run-audit.util';

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
    private readonly runSse: AgentRunSseGateway,
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

  async applyWriteGateDecision(
    input: ResumeAfterWriteGateInput,
    scope: RunExecutionScope,
  ): Promise<AgentRunResult | null> {
    const decision = normalizeDraftReviewDecision(input.decision);
    if (!decision) {
      this.runSse.emitRunError(input.sessionId, {
        message: '无效的写确认决策，请重试。',
        code: 'INVALID_DRAFT_REVIEW_DECISION',
        generation: scope.generation,
      });
      return null;
    }
    if (decision.action === 'cancel') {
      await this.cancelPendingWriteConfirmation(input.userId, input.sessionId);
      return null;
    }
    if (decision.action === 'retry') {
      return this.resumeAfterWriteGateRetry(input, scope, decision);
    }
    return this.resumeAfterWriteConfirm(input, scope, decision);
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
    await appendChatWriteConfirmRejectedAuditToPrimaryRun({
      prisma: this.prisma,
      primaryRunId: pending.runId,
      rejectChannel: 'session_cancel',
      decidedByUserId: userId,
      decisionNote: 'cancelled in chat',
    });
    this.runSse.purgeWriteConfirmationGate(sessionId, pending.runId);
    const message = '已取消操作。';
    this.runSse.emitWriteConfirmationCancelled(sessionId, {
      runId: pending.runId,
      turnId: pending.turnId,
      message,
    });
    if (pending.turnId != null) {
      await this.messagePersist.appendNoticeToTurnOutput({
        userId,
        sessionId,
        turnId: pending.turnId,
        noticeMarkdown: message,
      });
    }
  }

  private emitAgentRunComplete(
    sessionId: string,
    result: AgentRunResult,
  ): void {
    this.runSse.emitRunComplete(sessionId, {
      runId: result.runId,
      turnId: result.turnId,
      status: result.status,
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
      hasSuccessfulMutationStep(graphState.steps, graphState.scopedTools);

    if (mutationSucceeded) {
      const pageScope = resolveHostToolPageScope(pageContext);
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
          pageScope: pageScope ?? undefined,
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
        dispatchHostActionInstant(
          (sid, envelope) =>
            this.runSse.emitHostAction(sid, result.runId, envelope.payload),
          sessionId,
          {
            pageContext,
            runId: result.runId,
            turnId: result.turnId,
            hostTools,
            streamId: buildHostToolStreamId({
              runId: result.runId,
              turnId: result.turnId,
              stepId: 'completion',
            }),
            reason: 'agent_mutation_success',
            generation:
              this.runSse.getBoundRunGeneration(sessionId, result.runId) ??
              undefined,
          },
        );
      }
      const completionHostToolStep = buildCompletionHostToolRunStep({
        existingSteps: graphState.steps,
        pageScope: pageScope ?? undefined,
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
    this.runSse.emitWriteConfirmationExpired(sessionId);
  }

  async resumeAfterWriteConfirm(
    input: ResumeAfterWriteConfirmInput,
    scope: RunExecutionScope,
    decision?: ResumeAfterWriteGateInput['decision'] | null,
  ): Promise<AgentRunResult | null> {
    scope.assertActive();

    const prepared = await prepareWriteConfirmFromRedis({
      resumeInput: input,
      prisma: this.prisma,
      agentService: this.agentService,
      pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
      emitWriteConfirmationExpired: (sessionId) =>
        this.emitWriteConfirmationExpired(sessionId),
    });
    if (!prepared) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    const normalizedDecision =
      normalizeDraftReviewDecision(decision) ?? { action: 'confirm' as const };

    if (normalizedDecision.action === 'confirm_with_edits') {
      await validateWriteGateEditedToolCalls({
        consumed: prepared.consumed,
        decision: normalizedDecision,
        userId: input.userId,
        agentService: this.agentService,
        toolEngine: this.toolEngine,
      });
    }

    await releaseWriteConfirmGate({
      sessionId: input.sessionId,
      userId: input.userId,
      runId: prepared.suspendedPrimaryRunId,
      pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
      runSse: this.runSse,
    });

    const approvalAudit = {
      decidedByUserId: input.userId,
      nodeId: prepared.consumed.resumeContext.workflowRun?.currentNodeId ?? null,
    };

    return runWriteConfirmResume({
      resumeInput: input,
      prepared,
      scope,
      deps: this.buildWriteConfirmResumeDeps(),
      approvalAudit,
      decision: normalizedDecision,
    });
  }

  private async resumeAfterWriteGateRetry(
    input: ResumeAfterWriteConfirmInput,
    scope: RunExecutionScope,
    decision: NonNullable<ReturnType<typeof normalizeDraftReviewDecision>>,
  ): Promise<AgentRunResult | null> {
    scope.assertActive();

    const prepared = await prepareWriteConfirmFromRedis({
      resumeInput: input,
      prisma: this.prisma,
      agentService: this.agentService,
      pendingWriteConfirmationStore: this.pendingWriteConfirmationStore,
      emitWriteConfirmationExpired: (sessionId) =>
        this.emitWriteConfirmationExpired(sessionId),
    });
    if (!prepared) {
      this.emitWriteConfirmationExpired(input.sessionId);
      return null;
    }

    if (!canRequestDraftRetry(prepared.consumed.resumeContext.draftRetryCount)) {
      const budget = resolveDraftRetryBudget(
        prepared.consumed.resumeContext.draftRetryCount,
      );
      this.runSse.emitRunError(input.sessionId, {
        message: `已达到草稿重试上限（${budget.max} 次），请确认、编辑后提交或取消。`,
        code: 'DRAFT_RETRY_LIMIT_EXCEEDED',
        generation: scope.generation,
      });
      return null;
    }

    // 保留 Redis gate 直至再生草稿成功覆盖；失败时用户仍可 confirm/cancel。
    return runWriteGateRetry({
      resumeInput: input,
      prepared,
      scope,
      deps: this.buildWriteConfirmResumeDeps(),
      decision,
    });
  }

  private buildWriteConfirmResumeDeps() {
    return buildWriteConfirmResumeDeps(
      {
        emitWriteConfirmationExpired: (sessionId) =>
          this.emitWriteConfirmationExpired(sessionId),
        emitAgentRunComplete: (sessionId, result) =>
          this.emitAgentRunComplete(sessionId, result),
        emitRunCompletion: (...args) => this.emitRunCompletion(...args),
        handleRunAborted: (abortInput) => this.handleRunAborted(abortInput),
        handleRunFailure: (failureInput) => this.handleRunFailure(failureInput),
      },
      {
        prisma: this.prisma,
        agentService: this.agentService,
        llmService: this.llmService,
        goaService: this.goaService,
        toolEngine: this.toolEngine,
        langGraphRunner: this.langGraphRunner,
        lifecycle: this.lifecycle,
        sse: this.sse,
        assistantArtifact: this.assistantArtifact,
        promptComposer: this.promptComposer,
        logger: this.logger,
      },
    );
  }

  async run(
    input: AgentRunInput,
    scope: RunExecutionScope,
  ): Promise<AgentRunResult | null> {
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

    scope.assertActive();

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
    scope.assertActive();

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
    scope.assertActive();

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

    scope.assertActive();
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
    scope.startRun(run.id, turn.id);

    try {
      scope.assertActive(run.id);
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
        runGeneration: scope.generation,
        abortSignal: scope.abortSignal,
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
      if (isAgentRunAbortedError(error)) {
        const partial = await this.prisma.agentRun.findUnique({
          where: { id: run.id },
          select: { steps: true },
        });
        await this.handleRunAborted({
          error,
          sessionId: input.sessionId,
          turnId: turn.id,
          runId: run.id,
          runMetrics,
          scopedToolCount: tools.length,
          steps: this.lifecycle.parseStepsFromRun(partial?.steps),
        });
        throw error;
      }
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
      scope.endRun(run.id);
      this.sse.clearThinkBuffer(input.sessionId, run.id);
      this.assistantArtifact.clear(input.sessionId, run.id);
    }
  }

  private async handleRunAborted(input: {
    error: AgentRunAbortedError;
    sessionId: string;
    turnId: number;
    runId: number;
    runMetrics: ReturnType<typeof createRunMetricsAccumulator>;
    scopedToolCount: number;
    steps: AgentGraphState['steps'];
  }): Promise<void> {
    const finishReason =
      input.error.reason === 'superseded' ? 'superseded' : 'user_cancelled';
    await this.lifecycle.finalizeRunAndTurn({
      turnId: input.turnId,
      runId: input.runId,
      runMetrics: input.runMetrics,
      finalOutput: '',
      status: AgentRunStatus.failed,
      finishReason,
      error: input.error.message,
      scopedToolCount: input.scopedToolCount,
      steps: input.steps,
      currentStep: maxRunStepNumber(input.steps),
    });
    await this.prisma.messageTurn.update({
      where: { id: input.turnId },
      data: { status: AgentRunStatus.failed },
    });
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
