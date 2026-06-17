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
  isAllowedDownReasonTagKey,
  MESSAGE_FEEDBACK_DOWN_REASON_TAGS,
} from '../message/message-feedback.constants';
import { QueryMessageFeedbackAdminDto } from './dto/query-message-feedback-admin.dto';
import {
  toMessageFeedbackAdminListItem,
  toMessageFeedbackAdminListItems,
} from './message-feedback-admin.mapper';
import {
  MESSAGE_FEEDBACK_ADMIN_INCLUDE,
  type MessageFeedbackAdminListItem,
  type MessageFeedbackAdminSummary,
} from './message-feedback-admin.types';

@Injectable()
export class MessageFeedbackAdminService {
  constructor(private readonly prisma: PrismaService) {}

  listDownReasonTags() {
    return { items: [...MESSAGE_FEEDBACK_DOWN_REASON_TAGS] };
  }

  async findPage(
    appClientId: number,
    query: QueryMessageFeedbackAdminDto,
  ): Promise<PaginatedResult<MessageFeedbackAdminListItem>> {
    await this.assertAppClientExists(appClientId);
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(appClientId, query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.messageFeedback.findMany({
        where,
        orderBy,
        skip,
        take,
        include: MESSAGE_FEEDBACK_ADMIN_INCLUDE,
      }),
      this.prisma.messageFeedback.count({ where }),
    ]);
    const agentNameById = await this.loadAgentNames(
      appClientId,
      rows.map((row) => row.agentId),
    );
    return toPaginatedResult(
      toMessageFeedbackAdminListItems(rows, agentNameById),
      total,
      page,
      pageSize,
    );
  }

  async findPageBySession(
    appClientId: number,
    sessionId: string,
    query: QueryMessageFeedbackAdminDto,
  ): Promise<PaginatedResult<MessageFeedbackAdminListItem>> {
    return this.findPage(appClientId, {
      ...query,
      sessionId: sessionId.trim(),
    });
  }

  async findOne(
    appClientId: number,
    id: number,
  ): Promise<MessageFeedbackAdminListItem> {
    await this.assertAppClientExists(appClientId);
    const row = await this.prisma.messageFeedback.findFirst({
      where: { id, appClientId },
      include: MESSAGE_FEEDBACK_ADMIN_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`messageFeedback ${id} not found`);
    }
    const agentNameById = await this.loadAgentNames(appClientId, [row.agentId]);
    return toMessageFeedbackAdminListItem(row, agentNameById);
  }

  async getSummary(
    appClientId: number,
    days = 7,
  ): Promise<MessageFeedbackAdminSummary> {
    await this.assertAppClientExists(appClientId);
    const windowDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 7;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const to = new Date();
    const baseWhere: Prisma.MessageFeedbackWhereInput = {
      appClientId,
      createdAt: { gte: from, lte: to },
    };
    const [total, up, downRows] = await Promise.all([
      this.prisma.messageFeedback.count({ where: baseWhere }),
      this.prisma.messageFeedback.count({
        where: { ...baseWhere, rating: 'up' },
      }),
      this.prisma.messageFeedback.findMany({
        where: { ...baseWhere, rating: 'down' },
        select: { reasonTags: true, agentId: true },
      }),
    ]);
    const down = downRows.length;
    const tagCounts = new Map<string, number>();
    const agentDownCounts = new Map<number, number>();
    for (const row of downRows) {
      const tags = Array.isArray(row.reasonTags)
        ? row.reasonTags.filter((item): item is string => typeof item === 'string')
        : [];
      for (const tag of tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      if (row.agentId != null) {
        agentDownCounts.set(
          row.agentId,
          (agentDownCounts.get(row.agentId) ?? 0) + 1,
        );
      }
    }
    const agentIds = [...agentDownCounts.keys()];
    const agentNameById = await this.loadAgentNames(appClientId, agentIds);
    return {
      windowDays,
      from: from.toISOString(),
      to: to.toISOString(),
      totals: {
        feedback: total,
        up,
        down,
        upRate: total > 0 ? up / total : 0,
      },
      downReasonTagCounts: MESSAGE_FEEDBACK_DOWN_REASON_TAGS.map((tag) => ({
        key: tag.key,
        label: tag.label,
        count: tagCounts.get(tag.key) ?? 0,
      })).filter((row) => row.count > 0),
      downByAgent: agentIds
        .map((agentId) => ({
          agentId,
          agentName: agentNameById.get(agentId) ?? `Agent#${agentId}`,
          downCount: agentDownCounts.get(agentId) ?? 0,
        }))
        .sort((a, b) => b.downCount - a.downCount),
    };
  }

  private buildWhere(
    appClientId: number,
    query: QueryMessageFeedbackAdminDto,
  ): Prisma.MessageFeedbackWhereInput {
    const where: Prisma.MessageFeedbackWhereInput = { appClientId };
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.rating != null) {
      where.rating = query.rating;
    }
    if (query.agentId != null) {
      where.agentId = query.agentId;
    }
    if (query.userId != null) {
      where.userId = query.userId;
    }
    if (query.sessionId?.trim()) {
      where.sessionId = query.sessionId.trim();
    }
    if (query.messageId != null) {
      where.messageId = query.messageId;
    }
    if (query.turnId != null) {
      where.turnId = query.turnId;
    }
    if (query.reasonTag?.trim()) {
      const tag = query.reasonTag.trim();
      if (!isAllowedDownReasonTagKey(tag)) {
        where.id = -1;
      } else {
        where.reasonTags = {
          string_contains: `"${tag}"`,
        };
      }
    }
    if (query.commentKeyword?.trim()) {
      where.comment = {
        contains: query.commentKeyword.trim(),
        mode: 'insensitive',
      };
    }
    return where;
  }

  private buildOrderBy(
    orderBy: QueryMessageFeedbackAdminDto['orderBy'],
    order: QueryMessageFeedbackAdminDto['order'],
  ): Prisma.MessageFeedbackOrderByWithRelationInput {
    const field = orderBy ?? 'id';
    return { [field]: resolveSortOrder(order) };
  }

  private async loadAgentNames(
    appClientId: number,
    agentIds: Array<number | null | undefined>,
  ): Promise<Map<number, string>> {
    const ids = [...new Set(agentIds.filter((id): id is number => id != null))];
    if (ids.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.agent.findMany({
      where: { appClientId, id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(`appClient ${appClientId} not found`);
    }
  }
}
