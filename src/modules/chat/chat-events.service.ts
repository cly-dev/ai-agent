import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type Redis from 'ioredis';
import { Observable, Subject, Subscription } from 'rxjs';
import { CHAT_SSE_RELAY_CHANNEL } from '../../core/memory/redis/redis-keys';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import type { HostActionSsePayload } from '../../core/host-bridge/host-action.types';
import { shouldReplayHostAction } from '../../core/host-bridge/host-tool-stream-replay.util';
import type {
  MessageBlock,
  MessageBlockPatch,
} from '../../core/agent-engine/engine/message/message-blocks.types';
import type { WriteDraftPublic } from '../../core/draft-review/write-draft.types';
import { buildWriteConfirmationUserMessage } from '../../core/agent-engine/engine/write-confirmation-gate.util';
import { buildPendingWriteGatePublicState } from './chat-pending-write-gate.mapper';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';
import type { ChatSseRelayMessage } from './chat-sse-relay.types';

type EmitOptions = {
  /** 来自 Redis 中继，不再二次 publish。 */
  fromRelay?: boolean;
};

/** SSE 事件：think-思考，message-结果/信息，complete-完成，error-错误 */
export type ChatSseEvent =
  /** content 为增量片段（delta）或整段替换（replace）；由前端拼接展示 */
  | {
      event: 'think';
      payload: {
        content: string;
        mode?: 'delta' | 'replace';
        runId?: number;
        generation?: number;
      };
    }
  | {
      event: 'message';
      payload:
        | {
            source: 'agent-run';
            action: 'stream' | 'patch';
            runId?: number;
            turnId?: number;
            /** 主路径：Message Blocks */
            blocks?: MessageBlock[];
            /** action=patch：按 replaceId 替换 loading 占位 */
            patches?: MessageBlockPatch[];
            /** 决策环等流式文本增量时的兼容字段（SSE 层会包成 text block） */
            output?: string;
            code?: string;
            seq?: number;
            mode?: 'delta' | 'full';
            /** 本轮 run 入队时的 session generation，用于过滤被 supersede 的过期事件 */
            generation?: number;
          }
        | {
            source: 'agent-run';
            action: 'confirmation_required';
            runId: number;
            turnId?: number;
            message: string;
            generation?: number;
            draftRetryCount?: number;
            draftRetryMax?: number;
            canRetry?: boolean;
            writeDraft?: WriteDraftPublic;
            writeDrafts?: WriteDraftPublic[];
          }
        | {
            source: 'agent-run';
            action: 'write_confirmation_cancelled';
            runId?: number;
            turnId?: number;
            message: string;
            generation?: number;
          }
        | {
            source: 'message';
            action: 'created' | 'updated' | 'deleted';
            message?: Record<string, unknown>;
            id?: number;
          }
        | Record<string, unknown>;
    }
  | { event: 'complete'; payload: Record<string, unknown> }
  | {
      event: 'host_action';
      payload: HostActionSsePayload;
    }
  | { event: 'error'; payload: { message: string; code?: string; generation?: number } };

@Injectable()
export class ChatEventsService implements OnModuleInit, OnModuleDestroy {
  /** 保留最近事件，避免 SSE 晚于发消息连接时收不到推送 */
  private static readonly REPLAY_BUFFER = 8;
  private readonly logger = new Logger(ChatEventsService.name);
  private readonly instanceId = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
  private readonly subjects = new Map<string, Subject<ChatSseEvent>>();
  /** 晚连接时重放最近事件（条数有限） */
  private readonly replayBuffers = new Map<string, ChatSseEvent[]>();
  private subscriber: Redis | null = null;

  constructor(
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly redis: RedisConnectionService,
  ) {}

  onModuleInit(): void {
    const isProd =
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod';
    const client = this.redis.getClient();
    if (isProd && !client) {
      this.logger.error(
        'CHAT SSE: Redis is not configured in production — SSE will not relay across instances. Set REDIS_URL or REDIS_HOST.',
      );
    }
    if (!client) {
      return;
    }
    this.subscriber = client.duplicate();
    void this.subscriber
      .subscribe(CHAT_SSE_RELAY_CHANNEL)
      .then(() => {
        this.subscriber?.on('message', (_channel, raw) => {
          this.handleRelayMessage(raw);
        });
        this.logger.log(
          `chat SSE relay subscribed instanceId=${this.instanceId}`,
        );
      })
      .catch((error) => {
        this.logger.warn(
          `chat SSE relay subscribe failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
  }

  onModuleDestroy(): void {
    if (this.subscriber) {
      void this.subscriber.quit();
      this.subscriber = null;
    }
  }

  isRelayEnabled(): boolean {
    return this.redis.getClient() != null;
  }

  observeSession(sessionId: string, userId: number): Observable<ChatSseEvent> {
    const normalized = this.normalizeSessionId(sessionId);
    const subject = this.getSubject(normalized);
    return new Observable<ChatSseEvent>((subscriber) => {
      let inner: Subscription | null = null;
      for (const evt of this.getReplayEvents(normalized)) {
        subscriber.next(evt);
      }
      void this.pendingWriteConfirmationStore
        .get(normalized, userId)
        .then((pending) => {
          if (pending) {
            subscriber.next(this.buildPendingWriteConfirmationEvent(pending));
          }
          inner = subject.subscribe({
            next: (evt) => subscriber.next(evt),
            error: (err: unknown) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        })
        .catch((err: unknown) => subscriber.error(err));
      return () => inner?.unsubscribe();
    });
  }

  emit(sessionId: string, evt: ChatSseEvent, options?: EmitOptions): void {
    const normalized = this.normalizeSessionId(sessionId);
    this.deliverLocal(normalized, evt);
    if (!options?.fromRelay) {
      void this.publishRelay({
        kind: 'event',
        originInstanceId: this.instanceId,
        sessionId: normalized,
        evt,
      });
    }
  }

  private deliverLocal(sessionId: string, evt: ChatSseEvent): void {
    if (this.shouldBufferForReplay(evt)) {
      const buffer = this.replayBuffers.get(sessionId) ?? [];
      buffer.push(evt);
      while (buffer.length > ChatEventsService.REPLAY_BUFFER) {
        buffer.shift();
      }
      this.replayBuffers.set(sessionId, buffer);
    }
    if (evt.event === 'complete' && evt.payload.source === 'agent-run') {
      const runId = evt.payload.runId;
      if (typeof runId === 'number') {
        this.purgeWriteConfirmationGate(sessionId, runId);
      }
    }
    this.getSubject(sessionId).next(evt);
  }

  purgeReplayForSession(sessionId: string, options?: EmitOptions): void {
    const normalized = this.normalizeSessionId(sessionId);
    this.replayBuffers.delete(normalized);
    if (!options?.fromRelay) {
      void this.publishRelay({
        kind: 'purge_replay',
        originInstanceId: this.instanceId,
        sessionId: normalized,
      });
    }
  }

  emitRunAborted(
    sessionId: string,
    input: {
      runId: number;
      turnId?: number;
      generation: number;
      reason: 'cancelled' | 'superseded';
    },
  ): void {
    const normalized = this.normalizeSessionId(sessionId);
    this.emit(normalized, {
      event: 'error',
      payload: {
        message: '已停止生成。',
        code: 'RUN_CANCELLED',
        generation: input.generation,
      },
    });
    this.emit(normalized, {
      event: 'complete',
      payload: {
        source: 'agent-run',
        runId: input.runId,
        turnId: input.turnId,
        status: 'cancelled',
        generation: input.generation,
        reason: input.reason,
      },
    });
  }

  /** 确认/取消后移除缓冲区内可能残留的门闩事件（兼容旧版本曾写入缓冲区的数据）。 */
  purgeWriteConfirmationGate(sessionId: string, runId: number): void {
    const normalized = this.normalizeSessionId(sessionId);
    const buffer = this.replayBuffers.get(normalized);
    if (!buffer || buffer.length === 0) {
      return;
    }
    const next = buffer.filter(
      (evt) => !this.isWriteConfirmationGateEventForRun(evt, runId),
    );
    if (next.length !== buffer.length) {
      this.replayBuffers.set(normalized, next);
    }
  }

  closeSession(sessionId: string): void {
    const normalized = this.normalizeSessionId(sessionId);
    const sub = this.subjects.get(normalized);
    if (sub) {
      sub.complete();
      this.subjects.delete(normalized);
    }
    this.replayBuffers.delete(normalized);
  }

  private getReplayEvents(sessionId: string): ChatSseEvent[] {
    const buffer = this.replayBuffers.get(sessionId) ?? [];
    return buffer.filter((evt) => this.shouldReplayOnConnect(evt));
  }

  private shouldBufferForReplay(evt: ChatSseEvent): boolean {
    return this.shouldReplayOnConnect(evt);
  }

  private shouldReplayOnConnect(evt: ChatSseEvent): boolean {
    if (evt.event === 'error') {
      return false;
    }
    if (evt.event === 'host_action') {
      return shouldReplayHostAction(evt.payload);
    }
    if (evt.event === 'message' && evt.payload.source === 'agent-run') {
      const action = evt.payload.action;
      if (
        action === 'confirmation_required' ||
        action === 'write_confirmation_cancelled'
      ) {
        return false;
      }
    }
    return true;
  }

  private isWriteConfirmationGateEventForRun(
    evt: ChatSseEvent,
    runId: number,
  ): boolean {
    if (evt.event !== 'message' || evt.payload.source !== 'agent-run') {
      return false;
    }
    const action = evt.payload.action;
    if (
      action !== 'confirmation_required' &&
      action !== 'write_confirmation_cancelled'
    ) {
      return false;
    }
    return evt.payload.runId === runId;
  }

  private buildPendingWriteConfirmationEvent(
    pending: PendingWriteConfirmationSnapshot,
  ): ChatSseEvent {
    const gate = buildPendingWriteGatePublicState(pending);
    return {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'confirmation_required',
        message: buildWriteConfirmationUserMessage(),
        ...gate,
      },
    };
  }

  private normalizeSessionId(sessionId: string): string {
    return sessionId.trim().toLowerCase();
  }

  private getSubject(sessionId: string): Subject<ChatSseEvent> {
    const normalized = this.normalizeSessionId(sessionId);
    let sub = this.subjects.get(normalized);
    if (!sub) {
      sub = new Subject<ChatSseEvent>();
      this.subjects.set(normalized, sub);
    }
    return sub;
  }

  private async publishRelay(message: ChatSseRelayMessage): Promise<void> {
    const client = this.redis.getClient();
    if (!client) {
      return;
    }
    try {
      await client.publish(CHAT_SSE_RELAY_CHANNEL, JSON.stringify(message));
    } catch (error) {
      this.logger.warn(
        `chat SSE relay publish failed sessionId=${message.sessionId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private handleRelayMessage(raw: string): void {
    try {
      const message = JSON.parse(raw) as ChatSseRelayMessage;
      if (
        typeof message.originInstanceId !== 'string' ||
        typeof message.sessionId !== 'string' ||
        (message.kind !== 'event' && message.kind !== 'purge_replay')
      ) {
        return;
      }
      if (message.originInstanceId === this.instanceId) {
        return;
      }
      if (message.kind === 'purge_replay') {
        this.purgeReplayForSession(message.sessionId, { fromRelay: true });
        return;
      }
      if (!message.evt || typeof message.evt !== 'object') {
        return;
      }
      this.emit(message.sessionId, message.evt, { fromRelay: true });
    } catch {
      // ignore malformed relay payloads
    }
  }
}
