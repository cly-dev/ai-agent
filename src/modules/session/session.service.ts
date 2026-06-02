import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Prisma } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { toSessionResponse, toSessionResponseList } from './session.mapper';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto, type SessionOrderByField } from './dto/query-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SESSION_DETAIL_INCLUDE, type SessionResponse } from './session.types';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(appClientId: number, dto: CreateSessionDto): Promise<SessionResponse> {
    await this.assertAppClientExists(appClientId);
    await this.assertUserExists(dto.userId);
    if (dto.agentId != null) {
      await this.assertAgentBelongsToApp(dto.agentId, appClientId);
    }
    const id = this.normalizeSessionId(dto.id ?? randomBytes(16).toString('hex'));
    const row = await this.prisma.session.create({
      data: {
        id,
        userId: dto.userId,
        appClientId,
        agentId: dto.agentId ?? null,
        title: dto.title ?? null,
      },
      include: SESSION_DETAIL_INCLUDE,
    });
    return toSessionResponse(row);
  }

  async findPage(
    appClientId: number,
    query: QuerySessionDto,
  ): Promise<PaginatedResult<SessionResponse>> {
    await this.assertAppClientExists(appClientId);
    const { page, pageSize, skip, take } = resolvePagination(query.page, query.pageSize);
    const where = this.buildWhere(appClientId, query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        orderBy,
        skip,
        take,
        include: SESSION_DETAIL_INCLUDE,
      }),
      this.prisma.session.count({ where }),
    ]);
    return toPaginatedResult(toSessionResponseList(rows), total, page, pageSize);
  }

  async findOneById(id: string): Promise<SessionResponse> {
    const normalizedId = this.normalizeSessionId(id);
    const row = await this.prisma.session.findUnique({
      where: { id: normalizedId },
      include: SESSION_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`session ${normalizedId} not found`);
    }
    return toSessionResponse(row);
  }

  async findOne(appClientId: number, id: string): Promise<SessionResponse> {
    await this.assertAppClientExists(appClientId);
    const normalizedId = this.normalizeSessionId(id);
    const row = await this.prisma.session.findFirst({
      where: { id: normalizedId, appClientId },
      include: SESSION_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(
        `session ${normalizedId} not found under appClient ${appClientId}`,
      );
    }
    return toSessionResponse(row);
  }

  async update(
    appClientId: number,
    id: string,
    dto: UpdateSessionDto,
  ): Promise<SessionResponse> {
    const existing = await this.findOne(appClientId, id);
    if (dto.userId != null) {
      await this.assertUserExists(dto.userId);
    }
    if (dto.agentId != null) {
      await this.assertAgentBelongsToApp(dto.agentId, appClientId);
    }
    const row = await this.prisma.session.update({
      where: { id: existing.id },
      data: {
        userId: dto.userId,
        agentId: dto.agentId,
        title: dto.title,
      },
      include: SESSION_DETAIL_INCLUDE,
    });
    return toSessionResponse(row);
  }

  async remove(appClientId: number, id: string): Promise<SessionResponse> {
    const existing = await this.findOne(appClientId, id);
    await this.prisma.session.delete({ where: { id: existing.id } });
    return existing;
  }

  private buildWhere(appClientId: number, query: QuerySessionDto): Prisma.SessionWhereInput {
    const where: Prisma.SessionWhereInput = { appClientId };
    if (query.id?.trim()) {
      where.id = this.normalizeSessionId(query.id);
    }
    if (query.userId != null) {
      where.userId = query.userId;
    }
    if (query.agentId != null) {
      where.agentId = query.agentId;
    }
    if (query.title?.trim()) {
      where.title = { contains: query.title.trim(), mode: 'insensitive' };
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { id: { contains: keyword, mode: 'insensitive' } },
        { title: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy?: SessionOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.SessionOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'createdAt') {
      case 'id':
        return { id: direction };
      case 'updatedAt':
        return { createdAt: direction };
      case 'userId':
        return { userId: direction };
      case 'agentId':
        return { agentId: direction };
      case 'createdAt':
      default:
        return { createdAt: direction };
    }
  }

  private normalizeSessionId(id: string): string {
    return id.trim().toLowerCase();
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

  private async assertUserExists(userId: number): Promise<void> {
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`user ${userId} not found`);
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
}
