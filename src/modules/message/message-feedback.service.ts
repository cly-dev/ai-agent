import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MessageFeedback } from '../../../generated/prisma/client';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import type { UpsertMessageFeedbackDto } from './dto/message-feedback.dto';
import {
  isAllowedDownReasonTagKey,
  normalizeDownReasonTags,
} from './message-feedback.constants';
import type {
  MessageFeedbackBatchResponse,
  MessageFeedbackRating,
  MessageFeedbackView,
} from './message-feedback.types';

@Injectable()
export class MessageFeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async upsertForMessage(input: {
    sessionId: string;
    messageId: number;
    userId: number;
    appClientId: number;
    dto: UpsertMessageFeedbackDto;
  }): Promise<MessageFeedbackView> {
    await this.chatService.assertSessionOwnedByUser(
      input.sessionId,
      input.userId,
      input.appClientId,
    );
    const message = await this.prisma.message.findFirst({
      where: {
        id: input.messageId,
        sessionId: input.sessionId,
        role: 'assistant',
      },
      select: { id: true, sessionId: true },
    });
    if (!message) {
      throw new NotFoundException('assistant message not found');
    }

    const normalized = this.normalizeUpsertPayload(input.dto);
    const turn = await this.prisma.messageTurn.findFirst({
      where: { outputMessageId: message.id },
      orderBy: { id: 'desc' },
      select: { id: true, primaryAgentId: true },
    });

    const row = await this.prisma.messageFeedback.upsert({
      where: {
        messageId_userId: {
          messageId: message.id,
          userId: input.userId,
        },
      },
      create: {
        messageId: message.id,
        sessionId: input.sessionId,
        userId: input.userId,
        appClientId: input.appClientId,
        turnId: turn?.id ?? null,
        agentId: turn?.primaryAgentId ?? null,
        rating: normalized.rating,
        reasonTags:
          normalized.reasonTags.length > 0
            ? normalized.reasonTags
            : Prisma.JsonNull,
        comment: normalized.comment,
      },
      update: {
        rating: normalized.rating,
        reasonTags:
          normalized.reasonTags.length > 0
            ? normalized.reasonTags
            : Prisma.JsonNull,
        comment: normalized.comment,
        turnId: turn?.id ?? null,
        agentId: turn?.primaryAgentId ?? null,
      },
    });
    return this.toView(row);
  }

  async findForMessage(input: {
    sessionId: string;
    messageId: number;
    userId: number;
    appClientId: number;
  }): Promise<MessageFeedbackView | null> {
    await this.chatService.assertSessionOwnedByUser(
      input.sessionId,
      input.userId,
      input.appClientId,
    );
    const row = await this.prisma.messageFeedback.findFirst({
      where: {
        messageId: input.messageId,
        sessionId: input.sessionId,
        userId: input.userId,
      },
    });
    return row ? this.toView(row) : null;
  }

  async listForSessionMessages(input: {
    sessionId: string;
    userId: number;
    appClientId: number;
    messageIds: number[];
  }): Promise<MessageFeedbackBatchResponse> {
    await this.chatService.assertSessionOwnedByUser(
      input.sessionId,
      input.userId,
      input.appClientId,
    );
    const uniqueIds = [...new Set(input.messageIds)].filter((id) => id > 0);
    if (uniqueIds.length === 0) {
      return { items: [] };
    }
    const rows = await this.prisma.messageFeedback.findMany({
      where: {
        sessionId: input.sessionId,
        userId: input.userId,
        messageId: { in: uniqueIds },
      },
    });
    return { items: rows.map((row) => this.toView(row)) };
  }

  async removeForMessage(input: {
    sessionId: string;
    messageId: number;
    userId: number;
    appClientId: number;
  }): Promise<void> {
    await this.chatService.assertSessionOwnedByUser(
      input.sessionId,
      input.userId,
      input.appClientId,
    );
    await this.prisma.messageFeedback.deleteMany({
      where: {
        messageId: input.messageId,
        sessionId: input.sessionId,
        userId: input.userId,
      },
    });
  }

  parseMessageIdsParam(raw: string): number[] {
    const parts = raw.split(',').map((part) => part.trim());
    const ids: number[] = [];
    for (const part of parts) {
      if (!part) {
        continue;
      }
      const id = Number(part);
      if (!Number.isInteger(id) || id < 1) {
        throw new BadRequestException(`invalid messageId: ${part}`);
      }
      ids.push(id);
    }
    if (ids.length === 0) {
      throw new BadRequestException('messageIds is required');
    }
    if (ids.length > 100) {
      throw new BadRequestException('messageIds exceeds max 100');
    }
    return ids;
  }

  private normalizeUpsertPayload(dto: UpsertMessageFeedbackDto): {
    rating: MessageFeedbackRating;
    reasonTags: string[];
    comment: string | null;
  } {
    if (dto.rating === 'up') {
      if (dto.reasonTags?.length || dto.comment?.trim()) {
        throw new BadRequestException(
          '点赞不需要填写原因，请移除 reasonTags 与 comment',
        );
      }
      return { rating: 'up', reasonTags: [], comment: null };
    }

    const reasonTags = normalizeDownReasonTags(dto.reasonTags);
    for (const tag of reasonTags) {
      if (!isAllowedDownReasonTagKey(tag)) {
        throw new BadRequestException(`invalid down reason tag: ${tag}`);
      }
    }
    const comment = dto.comment?.trim() ?? '';
    if (reasonTags.length === 0 && !comment) {
      throw new BadRequestException(
        '点踩须至少选择一个原因标签或填写补充说明',
      );
    }
    if (reasonTags.includes('other') && !comment) {
      throw new BadRequestException('选择「其他」原因时须填写补充说明');
    }
    return {
      rating: 'down',
      reasonTags,
      comment: comment || null,
    };
  }

  private toView(row: MessageFeedback): MessageFeedbackView {
    const reasonTags = Array.isArray(row.reasonTags)
      ? row.reasonTags.filter((item): item is string => typeof item === 'string')
      : [];
    return {
      messageId: row.messageId,
      rating: row.rating as MessageFeedbackRating,
      reasonTags,
      comment: row.comment,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
