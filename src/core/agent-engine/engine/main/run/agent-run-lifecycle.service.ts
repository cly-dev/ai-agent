import { BadRequestException, Injectable } from '@nestjs/common';
import { AgentRunStatus } from '../../../../../../generated/prisma/client';
import type { Message } from '../../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { SessionGoaService } from '../../../../memory/goa/session-goa.service';
import { SessionHistoryCompressionService } from '../../../../memory/context/session-history-compression.service';
import type { SessionMemoryUpdateContext } from '../../../../memory/goa/session-goa.types';
import {
  resolveFinishReason,
  snapshotRunMetrics,
  type RunMetricsAccumulator,
} from '../../run-metrics.util';
import type { AgentService } from '../../../../../modules/agent/agent.service';
import {
  messageBlocksToPlainText,
  sanitizeStoredFinalOutput,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../../message/message-blocks.util';
import { AgentRunSseEmitter } from './agent-run-sse.emitter';
import { RunAssistantArtifactStore } from './run-assistant-artifact.store';
import { RunAssistantMessagePersistService } from './run-assistant-message-persist.service';
import { RuntimeCacheInvalidator } from '../../../../runtime-cache/runtime-cache-invalidator.service';
import type {
  AgentGraphState,
  AgentRunResult,
  AgentRunStep,
} from '../types/agent-engine.types';
import { maxRunStepNumber } from './agent-run-steps.util';
import { buildAgentRunGoaSnapshot } from '../../../../memory/goa/session-goa-run-snapshot.util';
import type { AgentRunGoaSnapshot } from '../../../../memory/goa/session-goa.types';
import { toStoredTaskPlan } from '../session/session-graph-resume.util';

function newToolObservationsFromGraph(
  graphState: Pick<AgentGraphState, 'toolObservations'>,
): Array<{ name: string; output: unknown; args?: Record<string, unknown> }> {
  return graphState.toolObservations.map((row) => ({
    name: row.name,
    output: row.output,
    ...(row.llmPayload?.args ? { args: row.llmPayload.args } : {}),
  }));
}

function buildMemoryUpdateContext(input: {
  turnId: number;
  runId: number;
  userInput: string;
  finalOutput: string;
  runStatus: 'success' | 'failed';
  graphState: Pick<
    AgentGraphState,
    | 'toolObservations'
    | 'steps'
    | 'taskPlan'
    | 'intentKind'
    | 'awaitingWriteConfirmation'
    | 'planAborted'
  >;
}): SessionMemoryUpdateContext {
  return {
    turnId: input.turnId,
    runId: input.runId,
    userInput: input.userInput,
    finalOutput: input.finalOutput,
    newToolObservations: newToolObservationsFromGraph(input.graphState),
    runSteps: input.graphState.steps.map((step) => ({
      type: step.type,
      name: step.name,
      output: step.output,
    })),
    storedTaskPlan: input.graphState.taskPlan
      ? toStoredTaskPlan(input.graphState.taskPlan)
      : null,
    runStatus: input.runStatus,
    intentKind: input.graphState.intentKind,
    phase: input.graphState.awaitingWriteConfirmation ? 'task_only' : 'full',
    awaitingWriteConfirmation: input.graphState.awaitingWriteConfirmation,
    abandonActiveTask: input.graphState.planAborted === true,
  };
}

@Injectable()
export class AgentRunLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goaService: SessionGoaService,
    private readonly sessionHistoryCompression: SessionHistoryCompressionService,
    private readonly sse: AgentRunSseEmitter,
    private readonly assistantArtifact: RunAssistantArtifactStore,
    private readonly messagePersist: RunAssistantMessagePersistService,
    private readonly runtimeCacheInvalidator: RuntimeCacheInvalidator,
  ) {}

  parseStepsFromRun(steps: unknown): AgentRunStep[] {
    if (!Array.isArray(steps)) {
      return [];
    }
    return steps as AgentRunStep[];
  }

  async updateRun(
    runId: number,
    steps: AgentRunStep[],
    status: AgentRunStatus,
  ): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        steps: steps as unknown as Prisma.InputJsonValue,
        currentStep: maxRunStepNumber(steps),
        status,
      },
    });
  }

  private buildRunFinishMetricsData(runMetrics: RunMetricsAccumulator, finishReason: string) {
    const snapshot = snapshotRunMetrics(runMetrics);
    return {
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
      finishReason,
    };
  }

  private async finalizeRunAndTurnInTx(
    tx: Prisma.TransactionClient,
    input: {
      turnId: number;
      runId: number;
      runMetrics: RunMetricsAccumulator;
      finalOutput: string;
      persistTurnAssistant: boolean;
      status: AgentRunStatus;
      finishReason: string;
      scopedToolCount?: number;
      error?: string;
      steps?: AgentRunStep[];
      currentStep?: number;
      goaSnapshot?: AgentRunGoaSnapshot | null;
    },
  ): Promise<void> {
    const metricsData = this.buildRunFinishMetricsData(
      input.runMetrics,
      input.finishReason,
    );
    await tx.agentRun.update({
      where: { id: input.runId },
      data: {
        ...(input.persistTurnAssistant
          ? { output: input.finalOutput || null }
          : {}),
        status: input.status,
        error: input.error ?? null,
        steps: input.steps
          ? (input.steps as unknown as Prisma.InputJsonValue)
          : undefined,
        currentStep: input.currentStep,
        goaSnapshot: input.goaSnapshot
          ? (input.goaSnapshot as unknown as Prisma.InputJsonValue)
          : undefined,
        ...metricsData,
      },
    });
    await tx.messageTurn.update({
      where: { id: input.turnId },
      data: {
        status: input.status,
        ...(input.persistTurnAssistant
          ? { finalOutput: input.finalOutput || null }
          : {}),
        ...metricsData,
      },
    });
  }

  async finalizeRunAndTurn(input: {
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
    goaSnapshot?: AgentRunGoaSnapshot | null;
    persistTurnAssistant?: boolean;
  }): Promise<void> {
    const finishReason = input.finishReason;
    const persistTurnAssistant =
      input.persistTurnAssistant ?? input.finalOutput.trim().length > 0;
    await this.prisma.$transaction((tx) =>
      this.finalizeRunAndTurnInTx(tx, {
        ...input,
        finishReason,
        persistTurnAssistant,
      }),
    );
  }

  sanitizeFinalOutput(finalOutput: string): string {
    return sanitizeStoredFinalOutput(finalOutput);
  }

  /** AgentRun.output / Message 内容仅来自本轮 assistant artifact。 */
  resolveFinalOutputFromArtifact(sessionId: string, runId: number): string {
    const fromArtifact = this.assistantArtifact.peekSerialized(sessionId, runId);
    return this.sanitizeFinalOutput(fromArtifact ?? '');
  }

  finalOutputPlainText(finalOutput: string): string {
    const blocks = tryParseStoredMessageBlocks(finalOutput);
    if (blocks?.length) {
      return messageBlocksToPlainText(blocks);
    }
    return finalOutput;
  }

  async awaitPostRunMemoryTasks(
    sessionId: string,
    ctx: SessionMemoryUpdateContext,
  ): Promise<void> {
    try {
      await this.goaService.refreshFromAgentRun(sessionId, ctx);
      await this.sessionHistoryCompression.maybeCompressAfterTurn(sessionId);
    } catch {
      // 记忆刷新失败不阻断 run 结束
    }
  }

  schedulePostRunMemoryTasks(
    sessionId: string,
    ctx: SessionMemoryUpdateContext,
  ): void {
    void this.awaitPostRunMemoryTasks(sessionId, ctx);
  }

  buildFailureMemoryContext(input: {
    turnId: number;
    runId: number;
    userInput: string;
    finalOutput: string;
    steps: AgentRunStep[];
  }): SessionMemoryUpdateContext {
    const toolObservations: Array<{ name: string; output: unknown }> = [];
    let intentKind: SessionMemoryUpdateContext['intentKind'] = 'task';

    for (const step of input.steps) {
      if (step.type === 'intent' && step.output != null && typeof step.output === 'object') {
        const row = step.output as Record<string, unknown>;
        if (row.intentKind === 'task' || row.intentKind === 'smalltalk' || row.intentKind === 'unclear') {
          intentKind = row.intentKind;
        }
      }
      if (step.type !== 'tool') {
        continue;
      }
      const output =
        step.meta?.observationOutput ??
        (step.output != null && typeof step.output === 'object' && !Array.isArray(step.output)
          ? (step.output as Record<string, unknown>).observation
          : step.output);
      if (typeof step.name === 'string' && step.name.trim()) {
        toolObservations.push({ name: step.name.trim(), output });
      }
    }

    return {
      turnId: input.turnId,
      runId: input.runId,
      userInput: input.userInput,
      finalOutput: input.finalOutput,
      newToolObservations: toolObservations,
      runSteps: input.steps.map((step) => ({
        type: step.type,
        name: step.name,
        output: step.output,
      })),
      runStatus: 'failed',
      intentKind,
    };
  }

  resolveFallbackReply(config: unknown): string | null {
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

  /**
   * 统一 run 收尾：补 SSE → 事务（定稿 AgentRun/MessageTurn + 落库 Message）→ 记忆刷新。
   * 凡经 SSE stream full 推送的用户可见 blocks（含 draft 预览）均落库。
   */
  async finishAgentRun(input: {
    userId: number;
    sessionId: string;
    turnId: number;
    runId: number;
    status: AgentRunStatus;
    steps: AgentRunStep[];
    scopedToolCount: number;
    runMetrics: RunMetricsAccumulator;
    finishedEarly?: boolean;
    goaSnapshot?: AgentRunGoaSnapshot | null;
    error?: string;
    memoryContext?: SessionMemoryUpdateContext;
  }): Promise<AgentRunResult> {
    const finalOutput = this.resolveFinalOutputFromArtifact(
      input.sessionId,
      input.runId,
    );
    const persistTurnAssistant = this.assistantArtifact.isPersistableAssistantArtifact(
      input.sessionId,
      input.runId,
    );
    const finishReason = resolveFinishReason({
      status: input.status,
      steps: input.steps,
      finishedEarly: input.finishedEarly === true,
      error: input.error,
    });
    this.sse.emitRunMessageBlocksIfNeeded(
      input.sessionId,
      input.runId,
      input.turnId,
    );
    let persistedMessage: Message | null = null;
    let replacedTurnOutput = false;
    await this.prisma.$transaction(async (tx) => {
      await this.finalizeRunAndTurnInTx(tx, {
        turnId: input.turnId,
        runId: input.runId,
        runMetrics: input.runMetrics,
        finalOutput,
        persistTurnAssistant,
        status: input.status,
        finishReason,
        error: input.error,
        scopedToolCount: input.scopedToolCount,
        steps: input.steps,
        currentStep: maxRunStepNumber(input.steps),
        goaSnapshot: input.goaSnapshot,
      });
      const persisted = await this.messagePersist.persistFromArtifactInTx(tx, {
        userId: input.userId,
        sessionId: input.sessionId,
        runId: input.runId,
        turnId: input.turnId,
      });
      persistedMessage = persisted.message;
      replacedTurnOutput = persisted.replacedTurnOutput;
    });
    if (persistedMessage) {
      await this.messagePersist.syncPersistedMessage(
        input.sessionId,
        persistedMessage,
        { replacedTurnOutput },
      );
    }
    if (input.memoryContext) {
      await this.awaitPostRunMemoryTasks(input.sessionId, input.memoryContext);
    }
    return {
      runId: input.runId,
      turnId: input.turnId,
      output: finalOutput,
      status: input.status,
    };
  }

  async completeAgentRunFromGraph(input: {
    userId: number;
    sessionId: string;
    turnId: number;
    runId: number;
    agent: NonNullable<Awaited<ReturnType<AgentService['getRuntimeAgent']>>>;
    latestUserMessage: string;
    graphState: AgentGraphState;
    runMetrics: RunMetricsAccumulator;
  }): Promise<AgentRunResult> {
    let status = input.graphState.status;
    const steps = [...input.graphState.steps];
    const goaSnapshot = buildAgentRunGoaSnapshot({
      graphState: input.graphState,
      runFailed: input.graphState.status === AgentRunStatus.failed,
    });

    if (
      !input.graphState.awaitingWriteConfirmation &&
      status !== AgentRunStatus.success
    ) {
      const fallback = this.resolveFallbackReply(input.agent.config);
      if (!fallback) {
        throw new BadRequestException('agent run exceeded max steps');
      }
      this.sse.publishAssistantBlocks(input.sessionId, input.runId, [
        textBlock(fallback),
      ]);
      status = AgentRunStatus.success;
    }

    const result = await this.finishAgentRun({
      userId: input.userId,
      sessionId: input.sessionId,
      turnId: input.turnId,
      runId: input.runId,
      status,
      steps,
      scopedToolCount: input.graphState.scopedTools.length,
      runMetrics: input.runMetrics,
      finishedEarly:
        input.graphState.finished && input.graphState.iteration === 0,
      goaSnapshot,
    });
    await this.awaitPostRunMemoryTasks(
      input.sessionId,
      buildMemoryUpdateContext({
        turnId: input.turnId,
        runId: input.runId,
        userInput: input.latestUserMessage,
        finalOutput: this.finalOutputPlainText(result.output),
        runStatus: status === AgentRunStatus.failed ? 'failed' : 'success',
        graphState: input.graphState,
      }),
    );
    this.runtimeCacheInvalidator.clearRunScope(input.runId);
    return result;
  }
}
