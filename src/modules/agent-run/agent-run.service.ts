import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentRunDto } from './dto/create-agent-run.dto';
import {
  QueryAgentRunDto,
  type AgentRunOrderByField,
} from './dto/query-agent-run.dto';
import { UpdateAgentRunDto } from './dto/update-agent-run.dto';
import { toAgentRunResponse, toAgentRunResponseList } from './agent-run.mapper';
import { AGENT_RUN_DETAIL_INCLUDE, type AgentRunResponse } from './agent-run.types';

@Injectable()
export class AgentRunService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpsMetrics(appClientId: number, days = 7): Promise<{
    windowDays: number;
    from: string;
    to: string;
    totals: {
      turns: number;
      runs: number;
      toolCalls: number;
      lowQualityObservations: number;
      intentExpandRetries: number;
      fallbackReplies: number;
      precheckChecks: number;
      precheckHits: number;
    };
    rates: {
      toolSuccessRate: number;
      lowQualityObservationRate: number;
      intentExpandRetryRate: number;
      avgStepsPerTurn: number;
      fallbackReplyRate: number;
      precheckHitRate: number;
    };
  }> {
    await this.assertAppClientExists(appClientId);
    const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const to = new Date();

    const [turnCount, runs] = await this.prisma.$transaction([
      this.prisma.messageTurn.count({
        where: { appClientId, createdAt: { gte: from } },
      }),
      this.prisma.agentRun.findMany({
        where: { appClientId, createdAt: { gte: from } },
        select: {
          turnId: true,
          toolCallCount: true,
          steps: true,
          toolsUsed: true,
        },
      }),
    ]);

    let totalToolCalls = 0;
    let lowQuality = 0;
    let toolFailures = 0;
    let totalSteps = 0;
    let precheckChecks = 0;
    let precheckHits = 0;
    const expandRetryTurnIds = new Set<number>();
    const fallbackTurnIds = new Set<number>();

    for (const run of runs) {
      totalToolCalls += run.toolCallCount ?? 0;
      const parsed = this.extractToolsUsedStats(run.toolsUsed);
      lowQuality += parsed.quality.low;
      toolFailures +=
        parsed.codes.TOOL_AUTH_FAILED +
        parsed.codes.TOOL_TIMEOUT +
        parsed.codes.TOOL_EMPTY_RESULT;
      const hasFallback =
        parsed.codes.TOOL_AUTH_FAILED > 0 ||
        parsed.codes.TOOL_TIMEOUT > 0 ||
        parsed.codes.TOOL_EMPTY_RESULT > 0 ||
        parsed.codes.LLM_TIMEOUT > 0 ||
        parsed.codes.LLM_RATE_LIMIT > 0;
      if (hasFallback && run.turnId != null) {
        fallbackTurnIds.add(run.turnId);
      }

      const steps = this.extractSteps(run.steps);
      totalSteps += steps.length;
      for (const step of steps) {
        if (!step || typeof step !== 'object' || Array.isArray(step)) {
          continue;
        }
        const row = step as { type?: unknown; output?: unknown };
        if (row.type !== 'precheck') {
          continue;
        }
        precheckChecks += 1;
        const output = row.output;
        if (!output || typeof output !== 'object' || Array.isArray(output)) {
          continue;
        }
        if (
          (output as { answerableFromObservation?: unknown })
            .answerableFromObservation === true
        ) {
          precheckHits += 1;
        }
      }
      const expanded = steps.some((step) => {
        if (!step || typeof step !== 'object' || Array.isArray(step)) {
          return false;
        }
        const row = step as { output?: unknown };
        const output = row.output;
        if (!output || typeof output !== 'object' || Array.isArray(output)) {
          return false;
        }
        return (
          (output as { fallbackReason?: unknown }).fallbackReason ===
          'low_quality_first_result_expand_once'
        );
      });
      if (expanded && run.turnId != null) {
        expandRetryTurnIds.add(run.turnId);
      }
    }

    const safeTurnCount = Math.max(1, turnCount);
    const safeToolCalls = Math.max(1, totalToolCalls);
    const safePrecheckChecks = Math.max(1, precheckChecks);
    return {
      windowDays,
      from: from.toISOString(),
      to: to.toISOString(),
      totals: {
        turns: turnCount,
        runs: runs.length,
        toolCalls: totalToolCalls,
        lowQualityObservations: lowQuality,
        intentExpandRetries: expandRetryTurnIds.size,
        fallbackReplies: fallbackTurnIds.size,
        precheckChecks,
        precheckHits,
      },
      rates: {
        toolSuccessRate: Number(
          ((totalToolCalls - toolFailures) / safeToolCalls).toFixed(4),
        ),
        lowQualityObservationRate: Number((lowQuality / safeToolCalls).toFixed(4)),
        intentExpandRetryRate: Number(
          (expandRetryTurnIds.size / safeTurnCount).toFixed(4),
        ),
        avgStepsPerTurn: Number((totalSteps / safeTurnCount).toFixed(4),
        ),
        fallbackReplyRate: Number((fallbackTurnIds.size / safeTurnCount).toFixed(4)),
        precheckHitRate: Number((precheckHits / safePrecheckChecks).toFixed(4)),
      },
    };
  }

  async create(appClientId: number, dto: CreateAgentRunDto): Promise<AgentRunResponse> {
    await this.assertAppClientExists(appClientId);
    await this.assertAgentBelongsToApp(dto.agentId, appClientId);
    if (dto.turnId != null) {
      await this.assertTurnBelongsToApp(dto.turnId, appClientId);
    }
    const row = await this.prisma.agentRun.create({
      data: {
        turnId: dto.turnId ?? null,
        agentId: dto.agentId,
        appClientId,
        sessionId: dto.sessionId,
        userId: dto.userId ?? null,
        role: dto.role,
        sequence: dto.sequence,
        parentRunId: dto.parentRunId ?? null,
        input: dto.input,
        output: dto.output ?? null,
        status: dto.status,
        steps: (dto.steps ?? []) as Prisma.InputJsonValue,
        currentStep: dto.currentStep,
        maxSteps: dto.maxSteps,
        error: dto.error ?? null,
        finishReason: dto.finishReason ?? null,
      },
      include: AGENT_RUN_DETAIL_INCLUDE,
    });
    return toAgentRunResponse(row);
  }

  async findPage(
    appClientId: number,
    query: QueryAgentRunDto,
  ): Promise<PaginatedResult<AgentRunResponse>> {
    await this.assertAppClientExists(appClientId);
    const { page, pageSize, skip, take } = resolvePagination(query.page, query.pageSize);
    const where = this.buildWhere(appClientId, query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.agentRun.findMany({
        where,
        orderBy,
        skip,
        take,
        include: AGENT_RUN_DETAIL_INCLUDE,
      }),
      this.prisma.agentRun.count({ where }),
    ]);
    return toPaginatedResult(toAgentRunResponseList(rows), total, page, pageSize);
  }

  async findOne(appClientId: number, id: number): Promise<AgentRunResponse> {
    await this.assertAppClientExists(appClientId);
    const row = await this.prisma.agentRun.findFirst({
      where: { id, appClientId },
      include: AGENT_RUN_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(
        `agentRun ${id} not found under appClient ${appClientId}`,
      );
    }
    return toAgentRunResponse(row);
  }

  async update(
    appClientId: number,
    id: number,
    dto: UpdateAgentRunDto,
  ): Promise<AgentRunResponse> {
    await this.findOne(appClientId, id);
    if (dto.agentId != null) {
      await this.assertAgentBelongsToApp(dto.agentId, appClientId);
    }
    if (dto.turnId != null) {
      await this.assertTurnBelongsToApp(dto.turnId, appClientId);
    }
    const row = await this.prisma.agentRun.update({
      where: { id },
      data: {
        turnId: dto.turnId,
        agentId: dto.agentId,
        sessionId: dto.sessionId,
        userId: dto.userId,
        role: dto.role,
        sequence: dto.sequence,
        parentRunId: dto.parentRunId,
        input: dto.input,
        output: dto.output,
        status: dto.status,
        steps:
          dto.steps === undefined
            ? undefined
            : (dto.steps as Prisma.InputJsonValue),
        currentStep: dto.currentStep,
        maxSteps: dto.maxSteps,
        error: dto.error,
        finishReason: dto.finishReason,
      },
      include: AGENT_RUN_DETAIL_INCLUDE,
    });
    return toAgentRunResponse(row);
  }

  async remove(appClientId: number, id: number): Promise<AgentRunResponse> {
    const row = await this.findOne(appClientId, id);
    await this.prisma.agentRun.delete({ where: { id } });
    return row;
  }

  private buildWhere(
    appClientId: number,
    query: QueryAgentRunDto,
  ): Prisma.AgentRunWhereInput {
    const where: Prisma.AgentRunWhereInput = { appClientId };
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.turnId != null) {
      where.turnId = query.turnId;
    }
    if (query.agentId != null) {
      where.agentId = query.agentId;
    }
    if (query.sessionId?.trim()) {
      where.sessionId = query.sessionId.trim();
    }
    if (query.userId != null) {
      where.userId = query.userId;
    }
    if (query.role != null) {
      where.role = query.role;
    }
    if (query.status != null) {
      where.status = query.status;
    }
    if (query.input?.trim()) {
      where.input = { contains: query.input.trim(), mode: 'insensitive' };
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { input: { contains: keyword, mode: 'insensitive' } },
        { output: { contains: keyword, mode: 'insensitive' } },
        { error: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    if (query.minLowQualityCount != null) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          toolsUsed: {
            path: ['qualityCounts', 'low'],
            gte: query.minLowQualityCount,
          },
        },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy?: AgentRunOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.AgentRunOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'id') {
      case 'sequence':
        return { sequence: direction };
      case 'createdAt':
        return { createdAt: direction };
      case 'updatedAt':
        return { updatedAt: direction };
      case 'startedAt':
        return { startedAt: direction };
      case 'finishedAt':
        return { finishedAt: direction };
      case 'durationMs':
        return { durationMs: direction };
      case 'totalTokens':
        return { totalTokens: direction };
      case 'id':
      default:
        return { id: direction };
    }
  }

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`appClient ${appClientId} not found`);
    }
  }

  private async assertAgentBelongsToApp(agentId: number, appClientId: number): Promise<void> {
    const row = await this.prisma.agent.findFirst({
      where: { id: agentId, appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(
        `agent ${agentId} not found under appClient ${appClientId}`,
      );
    }
  }

  private async assertTurnBelongsToApp(turnId: number, appClientId: number): Promise<void> {
    const row = await this.prisma.messageTurn.findFirst({
      where: { id: turnId, appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(
        `messageTurn ${turnId} not found under appClient ${appClientId}`,
      );
    }
  }

  private extractSteps(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private extractToolsUsedStats(value: unknown): {
    quality: { high: number; medium: number; low: number };
    codes: {
      INTENT_RECALL_FAILED: number;
      TOOL_AUTH_FAILED: number;
      TOOL_TIMEOUT: number;
      TOOL_EMPTY_RESULT: number;
      LLM_TIMEOUT: number;
      LLM_RATE_LIMIT: number;
    };
  } {
    const asInt = (v: unknown): number =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {
        quality: { high: 0, medium: 0, low: 0 },
        codes: {
          INTENT_RECALL_FAILED: 0,
          TOOL_AUTH_FAILED: 0,
          TOOL_TIMEOUT: 0,
          TOOL_EMPTY_RESULT: 0,
          LLM_TIMEOUT: 0,
          LLM_RATE_LIMIT: 0,
        },
      };
    }
    const row = value as {
      qualityCounts?: { high?: unknown; medium?: unknown; low?: unknown };
      codeCounts?: {
        INTENT_RECALL_FAILED?: unknown;
        TOOL_AUTH_FAILED?: unknown;
        TOOL_TIMEOUT?: unknown;
        TOOL_EMPTY_RESULT?: unknown;
        LLM_TIMEOUT?: unknown;
        LLM_RATE_LIMIT?: unknown;
      };
    };
    const q = row.qualityCounts ?? {};
    const c = row.codeCounts ?? {};
    return {
      quality: {
        high: asInt(q.high),
        medium: asInt(q.medium),
        low: asInt(q.low),
      },
      codes: {
        INTENT_RECALL_FAILED: asInt(c.INTENT_RECALL_FAILED),
        TOOL_AUTH_FAILED: asInt(c.TOOL_AUTH_FAILED),
        TOOL_TIMEOUT: asInt(c.TOOL_TIMEOUT),
        TOOL_EMPTY_RESULT: asInt(c.TOOL_EMPTY_RESULT),
        LLM_TIMEOUT: asInt(c.LLM_TIMEOUT),
        LLM_RATE_LIMIT: asInt(c.LLM_RATE_LIMIT),
      },
    };
  }
}
