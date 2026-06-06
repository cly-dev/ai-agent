import { BadRequestException, Injectable } from '@nestjs/common';
import { AgentRunStatus } from '../../../../../generated/prisma/client';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { WorkingMemoryService } from '../../../memory/working-memory.service';
import { SessionHistoryCompressionService } from '../../../memory/session-history-compression.service';
import type { WorkingMemoryUpdateContext } from '../../../memory/session-context.types';
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

@Injectable()
export class AgentRunLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workingMemoryService: WorkingMemoryService,
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
            : (input.steps as unknown as Prisma.InputJsonValue),
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

  sanitizeFinalOutput(value: string): string {
    return sanitizeStoredFinalOutput(value);
  }

  finalOutputForWorkingMemory(finalOutput: string): string {
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

  schedulePostRunMemoryTasks(
    sessionId: string,
    ctx: WorkingMemoryUpdateContext,
  ): void {
    void this.workingMemoryService
      .refreshFromAgentRun(sessionId, ctx)
      .then(() => this.sessionHistoryCompression.maybeCompressAfterTurn(sessionId))
      .catch(() => undefined);
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
      });
      this.emitRunMessageBlocksIfNeeded(
        input.sessionId,
        input.runId,
        input.turnId,
        this.blocksFromFinalOutput(finalOutput),
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
    });
    this.emitRunMessageBlocksIfNeeded(
      input.sessionId,
      input.runId,
      input.turnId,
      this.blocksFromFinalOutput(finalOutput),
    );
    this.schedulePostRunMemoryTasks(input.sessionId, {
      userInput: input.latestUserMessage,
      finalOutput: this.finalOutputForWorkingMemory(finalOutput),
      toolObservations: input.graphState.toolObservations,
    });

    return {
      runId: input.runId,
      turnId: input.turnId,
      output: finalOutput,
      status,
    };
  }
}
