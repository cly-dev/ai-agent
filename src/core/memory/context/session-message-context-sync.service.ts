import { Injectable, Logger } from '@nestjs/common';
import type { Message } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { trimTurnsByCompressedWatermark } from './session-context-trim.util';
import { SessionContextStore } from './session-context.store';
import {
  isSessionContextPayload,
  type SessionContextPayload,
  type SessionContextTurn,
} from './session-context.types';

@Injectable()
export class SessionMessageContextSyncService {
  private readonly logger = new Logger(SessionMessageContextSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionContextStore: SessionContextStore,
  ) {}

  messageToTurn(message: Message): SessionContextTurn {
    return {
      messageId: message.id,
      role: message.role,
      content: message.content ?? null,
      toolName: message.toolName ?? null,
      toolInput: message.toolInput ?? null,
      toolOutput: message.toolOutput ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async syncAfterMessageContentUpdate(
    sessionId: string,
    message: Message,
  ): Promise<void> {
    try {
      const turn = this.messageToTurn(message);
      const patched = await this.sessionContextStore.tryPatchMerge(
        sessionId,
        (current) => {
          if (!isSessionContextPayload(current)) {
            return current;
          }
          const payload = current as SessionContextPayload;
          const turns = payload.turns.map((row) =>
            row.messageId === turn.messageId ? turn : row,
          );
          return {
            ...payload,
            sessionId,
            turns,
            updatedAt: new Date().toISOString(),
          };
        },
      );
      if (patched == null || !isSessionContextPayload(patched)) {
        await this.rebuildFromDb(sessionId);
      }
    } catch (error) {
      this.logger.warn(
        `failed to sync redis session context update for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async syncAfterMessageCreate(
    sessionId: string,
    message: Message,
  ): Promise<void> {
    try {
      const turn = this.messageToTurn(message);
      const patched = await this.sessionContextStore.tryPatchMerge(
        sessionId,
        (current) => {
          if (!isSessionContextPayload(current)) {
            return current;
          }
          const payload = current as SessionContextPayload;
          const last = payload.turns[payload.turns.length - 1];
          if (last?.messageId === turn.messageId) {
            return payload;
          }
          return {
            ...payload,
            sessionId,
            turns: [...payload.turns, turn],
            updatedAt: new Date().toISOString(),
          };
        },
      );
      if (patched == null) {
        await this.rebuildFromDb(sessionId);
        return;
      }
      if (!isSessionContextPayload(patched)) {
        await this.rebuildFromDb(sessionId);
      }
    } catch (error) {
      this.logger.warn(
        `failed to sync redis session context for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async rebuildFromDb(sessionId: string): Promise<void> {
    try {
      const rows = await this.prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
      });
      const existing = await this.sessionContextStore.get(sessionId);
      const prevPayload =
        existing && isSessionContextPayload(existing) ? existing : undefined;
      let turns = rows.map((row) => this.messageToTurn(row));
      const compressedUpToMessageId = prevPayload?.compressedUpToMessageId;
      if (compressedUpToMessageId != null) {
        turns = trimTurnsByCompressedWatermark(turns, compressedUpToMessageId);
      }
      const updatedAt = new Date().toISOString();
      const cached =
        prevPayload != null
          ? await this.sessionContextStore.tryPatch(sessionId, {
              turns,
              updatedAt,
            })
          : await this.sessionContextStore.tryPatch(sessionId, {
              sessionId,
              turns,
              compressedUpToMessageId,
              updatedAt,
            });
      if (!cached) {
        this.logger.debug(
          `session context rebuild skipped (Redis unavailable) sessionId=${sessionId}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `failed to rebuild redis session context for sessionId=${sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
