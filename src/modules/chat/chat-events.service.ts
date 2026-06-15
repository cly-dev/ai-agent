import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type {
  MessageBlock,
  MessageBlockPatch,
} from '../../core/agent-engine/engine/message/message-blocks.types';

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
  | { event: 'error'; payload: { message: string; code?: string } };

@Injectable()
export class ChatEventsService {
  /** 保留最近事件，避免 SSE 晚于发消息连接时收不到推送 */
  private static readonly REPLAY_BUFFER = 8;
  private readonly subjects = new Map<string, Subject<ChatSseEvent>>();
  /** 晚连接时重放最近事件（条数有限） */
  private readonly replayBuffers = new Map<string, ChatSseEvent[]>();

  observeSession(sessionId: string): Observable<ChatSseEvent> {
    const normalized = this.normalizeSessionId(sessionId);
    const subject = this.getSubject(normalized);
    return new Observable<ChatSseEvent>((subscriber) => {
      for (const evt of this.replayBuffers.get(normalized) ?? []) {
        if (evt.event === 'error') {
          continue;
        }
        subscriber.next(evt);
      }
      const inner = subject.subscribe({
        next: (evt) => subscriber.next(evt),
        error: (err: unknown) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });
      return () => inner.unsubscribe();
    });
  }

  emit(sessionId: string, evt: ChatSseEvent): void {
    const normalized = this.normalizeSessionId(sessionId);
    // error 为瞬时信号，不重放，避免打开/重连会话时展示上一轮失败
    if (evt.event !== 'error') {
      const buffer = this.replayBuffers.get(normalized) ?? [];
      buffer.push(evt);
      while (buffer.length > ChatEventsService.REPLAY_BUFFER) {
        buffer.shift();
      }
      this.replayBuffers.set(normalized, buffer);
    }
    this.getSubject(normalized).next(evt);
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
