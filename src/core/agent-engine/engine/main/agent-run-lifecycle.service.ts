import { BadRequestException, Injectable } from '@nestjs/common';
import { AgentRunStatus } from '../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SessionGoaService } from '../../../memory/goa/session-goa.service';
import { SessionHistoryCompressionService } from '../../../memory/context/session-history-compression.service';
import type { SessionMemoryUpdateContext } from '../../../memory/goa/session-goa.types';
import {
  resolveFinishReason,
  snapshotRunMetrics,
  type RunMetricsAccumulator,
} from '../run-metrics.util';
import type { AgentService } from '../../../../modules/agent/agent.service';
import {
  messageBlocksToPlainText,
  sanitizeMessageBlocks,
  sanitizeStoredFinalOutput,
  textBlock,
  tryParseStoredMessageBlocks,
} from '../message/message-blocks.util';
import type { MessageBlock } from '../message/message-blocks.types';
import { AgentRunSseEmitter } from './agent-run-sse.emitter';
import type {
  AgentEngineTool,
  AgentGraphState,
  AgentRunResult,
  AgentRunStep,
} from './agent-engine.types';
import { buildAgentRunGoaSnapshot } from '../../../memory/goa/session-goa-run-snapshot.util';
import type { AgentRunGoaSnapshot } from '../../../memory/goa/session-goa.types';
import { toStoredTaskPlan } from './session-graph-resume.util';

function newToolObservationsFromGraph(
  graphState: Pick<AgentGraphState, 'toolObservations'>,
): Array<{ name: string; output: unknown }> {
  return graphState.toolObservations.map((row) => ({
    name: row.name,
    output: row.output,
  }));
}

function buildMemoryUpdateContext(input: {
  turnId: number;
  runId: number;
  userInput: string;
  finalOutput: string;
  graphState: Pick<
    AgentGraphState,
    | 'toolObservations'
    | 'steps'
    | 'taskPlan'
    | 'status'
    | 'intentKind'
    | 'awaitingWriteConfirmation'
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
    runStatus:
      input.graphState.status === AgentRunStatus.failed ? 'failed' : 'success',
    intentKind: input.graphState.intentKind,
    phase: input.graphState.awaitingWriteConfirmation ? 'task_only' : 'full',
    awaitingWriteConfirmation: input.graphState.awaitingWriteConfirmation,
  };
}

@Injectable()
export class AgentRunLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goaService: SessionGoaService,
    private readonly sessionHistoryCompression: SessionHistoryCompressionService,
    private readonly sse: AgentRunSseEmitter,
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
    currentStep: number,
    status: AgentRunStatus,
  ): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: runId },
      data: {
        steps: steps as unknown as Prisma.InputJsonValue,
        currentStep,
        status,
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
    await this.prisma.messageTurn.update({
      where: { id: input.turnId },
      data: {
        status: input.status,
        finalOutput: input.finalOutput || null,
        ...metricsData,
      },
    });
  }

  sanitizeFinalOutput(finalOutput: string): string {
    return sanitizeStoredFinalOutput(finalOutput);
  }

  finalOutputPlainText(finalOutput: string): string {
    const blocks = tryParseStoredMessageBlocks(finalOutput);
    if (blocks?.length) {
      return messageBlocksToPlainText(blocks);
    }
    return finalOutput;
  }

  blocksFromFinalOutput(finalOutput: string): MessageBlock[] {
    const blocks = tryParseStoredMessageBlocks(finalOutput);
    if (blocks?.length) {
      return sanitizeMessageBlocks(blocks);
    }
    const text = this.sanitizeFinalOutput(finalOutput);
    return text ? [textBlock(text)] : [];
  }

  emitRunMessageBlocksIfNeeded(
    sessionId: string,
    runId: number,
    turnId: number,
    blocks: MessageBlock[],
  ): void {
    this.sse.emitRunMessageBlocksIfNeeded(sessionId, runId, turnId, blocks);
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

  async completeAgentRunFromGraph(input: {
    sessionId: string;
    turnId: number;
    runId: number;
    agent: NonNullable<Awaited<ReturnType<AgentService['getRuntimeAgent']>>>;
    tools: AgentEngineTool[];
    latestUserMessage: string;
    graphState: AgentGraphState;
    runMetrics: RunMetricsAccumulator;
  }): Promise<AgentRunResult> {
    let status = input.graphState.status;
    let finalOutput = input.graphState.finalOutput;
    const steps = [...input.graphState.steps];
    const goaSnapshot = buildAgentRunGoaSnapshot({
      graphState: input.graphState,
      runFailed: input.graphState.status === AgentRunStatus.failed,
    });

    if (input.graphState.awaitingWriteConfirmation) {
      finalOutput = this.sanitizeFinalOutput(finalOutput);
      const finishReason = resolveFinishReason({
        status,
        steps,
        finishedEarly: false,
      });
      await this.finalizeRunAndTurn({
        turnId: input.turnId,
        runId: input.runId,
        runMetrics: input.runMetrics,
        finalOutput,
        status,
        finishReason,
        scopedToolCount: input.graphState.scopedTools.length,
        steps,
        currentStep: input.graphState.iteration,
        goaSnapshot,
      });
      this.emitRunMessageBlocksIfNeeded(
        input.sessionId,
        input.runId,
        input.turnId,
        this.blocksFromFinalOutput(finalOutput),
      );
      await this.awaitPostRunMemoryTasks(
        input.sessionId,
        buildMemoryUpdateContext({
          turnId: input.turnId,
          runId: input.runId,
          userInput: input.latestUserMessage,
          finalOutput: this.finalOutputPlainText(finalOutput),
          graphState: input.graphState,
        }),
      );
      return {
        runId: input.runId,
        turnId: input.turnId,
        output: finalOutput,
        status,
      };
    }

    if (status !== AgentRunStatus.success) {
      const fallback = this.resolveFallbackReply(input.agent.config);
      if (!fallback) {
        throw new BadRequestException('agent run exceeded max steps');
      }
      finalOutput = fallback;
      status = AgentRunStatus.success;
    }
    finalOutput = this.sanitizeFinalOutput(finalOutput);

    const finishReason = resolveFinishReason({
      status,
      steps,
      finishedEarly:
        input.graphState.finished && input.graphState.iteration === 0,
    });
    await this.finalizeRunAndTurn({
      turnId: input.turnId,
      runId: input.runId,
      runMetrics: input.runMetrics,
      finalOutput,
      status,
      finishReason,
      scopedToolCount: input.graphState.scopedTools.length,
      steps,
      currentStep: input.graphState.iteration,
      goaSnapshot,
    });
    this.emitRunMessageBlocksIfNeeded(
      input.sessionId,
      input.runId,
      input.turnId,
      this.blocksFromFinalOutput(finalOutput),
    );
    await this.awaitPostRunMemoryTasks(
      input.sessionId,
      buildMemoryUpdateContext({
        turnId: input.turnId,
        runId: input.runId,
        userInput: input.latestUserMessage,
        finalOutput: this.finalOutputPlainText(finalOutput),
        graphState: input.graphState,
      }),
    );

    return {
      runId: input.runId,
      turnId: input.turnId,
      output: finalOutput,
      status,
    };
  }
}
