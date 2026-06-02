import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QueryMessageTurnDto,
  type MessageTurnOrderByField,
} from './dto/query-message-turn.dto';
import {
  toMessageTurnResponse,
  toMessageTurnResponseList,
} from './message-turn.mapper';
import {
  MESSAGE_TURN_DETAIL_INCLUDE,
  type MessageTurnResponse,
} from './message-turn.types';

@Injectable()
export class MessageTurnService {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    query: QueryMessageTurnDto,
  ): Promise<PaginatedResult<MessageTurnResponse>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.messageTurn.findMany({
        where,
        orderBy,
        skip,
        take,
        include: MESSAGE_TURN_DETAIL_INCLUDE,
      }),
      this.prisma.messageTurn.count({ where }),
    ]);
    return toPaginatedResult(
      toMessageTurnResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findPageBySessionId(
    sessionId: string,
    query: QueryMessageTurnDto,
  ): Promise<PaginatedResult<MessageTurnResponse>> {
    return this.findPage({
      ...query,
      sessionId,
    });
  }

  async findOne(id: number): Promise<MessageTurnResponse> {
    const row = await this.prisma.messageTurn.findUnique({
      where: { id },
      include: MESSAGE_TURN_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`messageTurn ${id} not found`);
    }
    return toMessageTurnResponse(row);
  }

  private buildWhere(query: QueryMessageTurnDto): Prisma.MessageTurnWhereInput {
    const where: Prisma.MessageTurnWhereInput = {};
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.messageId != null) {
      where.messageId = query.messageId;
    }
    if (query.sessionId?.trim()) {
      where.sessionId = query.sessionId.trim();
    }
    if (query.userId != null) {
      where.userId = query.userId;
    }
    if (query.appClientId != null) {
      where.appClientId = query.appClientId;
    }
    if (query.primaryAgentId != null) {
      where.primaryAgentId = query.primaryAgentId;
    }
    if (query.status != null) {
      where.status = query.status;
    }
    if (query.userInput?.trim()) {
      where.userInput = {
        contains: query.userInput.trim(),
        mode: 'insensitive',
      };
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { userInput: { contains: keyword, mode: 'insensitive' } },
        { finalOutput: { contains: keyword, mode: 'insensitive' } },
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
    orderBy?: MessageTurnOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.MessageTurnOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'id') {
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
}
