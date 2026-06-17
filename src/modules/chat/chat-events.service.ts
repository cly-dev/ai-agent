import { Injectable } from '@nestjs/common';
import { Observable, Subject, Subscription } from 'rxjs';
import type { HostActionSsePayload } from '../../core/host-bridge/host-action.types';
import type {
  MessageBlock,
  MessageBlockPatch,
} from '../../core/agent-engine/engine/message/message-blocks.types';
import { buildWriteConfirmationUserMessage } from '../../core/agent-engine/engine/write-confirmation-gate.util';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';
import type { PendingWriteConfirmationSnapshot } from './pending-write-confirmation.types';

/** SSE 事件：think-思考，message-结果/信息，complete-完成，error-错误 */
export type ChatSseEvent =
  /** content 为增量片段（delta）或整段替换（replace）；由前端拼接展示 */
  | {
      event: 'think';
      payload: { content: string; mode?: 'delta' | 'replace' };
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
          }
        | {
            source: 'agent-run';
            action: 'confirmation_required';
            runId: number;
            turnId?: number;
            /** 弹窗提示文案；具体 Tool 不返回，由服务端缓存待执行列表 */
            message: string;
          }
        | {
            source: 'agent-run';
            action: 'write_confirmation_cancelled';
            runId?: number;
            turnId?: number;
            message: string;
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
  | { event: 'error'; payload: { message: string; code?: string } };

@Injectable()
export class ChatEventsService {
  /** 保留最近事件，避免 SSE 晚于发消息连接时收不到推送 */
  private static readonly REPLAY_BUFFER = 8;
  private readonly subjects = new Map<string, Subject<ChatSseEvent>>();
  /** 晚连接时重放最近事件（条数有限） */
  private readonly replayBuffers = new Map<string, ChatSseEvent[]>();

  constructor(
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
  ) {}

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

  emit(sessionId: string, evt: ChatSseEvent): void {
    const normalized = this.normalizeSessionId(sessionId);
    if (this.shouldBufferForReplay(evt)) {
      const buffer = this.replayBuffers.get(normalized) ?? [];
      buffer.push(evt);
      while (buffer.length > ChatEventsService.REPLAY_BUFFER) {
        buffer.shift();
      }
      this.replayBuffers.set(normalized, buffer);
    }
    if (evt.event === 'complete' && evt.payload.source === 'agent-run') {
      const runId = evt.payload.runId;
      if (typeof runId === 'number') {
        this.purgeWriteConfirmationGate(normalized, runId);
      }
    }
    this.getSubject(normalized).next(evt);
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
    return {
      event: 'message',
      payload: {
        source: 'agent-run',
        action: 'confirmation_required',
        runId: pending.runId,
        turnId: pending.turnId,
        message: buildWriteConfirmationUserMessage(),
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
}
