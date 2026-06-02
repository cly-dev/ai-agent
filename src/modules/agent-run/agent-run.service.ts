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
}
