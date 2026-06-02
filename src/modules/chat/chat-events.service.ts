import { Injectable } from '@nestjs/common';
import { Observable, ReplaySubject } from 'rxjs';

/** SSE 事件：think-思考，result-结果，complete-推送完成，error-推送失败 */
export type ChatSseEvent =
  /** content 为当前 run 内合并后的完整思考过程（非增量片段） */
  | { event: 'think'; payload: { content: string } }
  | { event: 'result'; payload: { content: string } }
  | { event: 'complete'; payload: Record<string, unknown> }
  | { event: 'error'; payload: { message: string; code?: string } };

@Injectable()
export class ChatEventsService {
  /** 保留最近事件，避免 SSE 晚于发消息连接时收不到推送 */
  private static readonly REPLAY_BUFFER = 64;
  private readonly subjects = new Map<string, ReplaySubject<ChatSseEvent>>();

  observeSession(sessionId: string): Observable<ChatSseEvent> {
    const normalized = this.normalizeSessionId(sessionId);
    return this.getSubject(normalized).asObservable();
  }

  emit(sessionId: string, evt: ChatSseEvent): void {
    this.getSubject(sessionId).next(evt);
  }

  closeSession(sessionId: string): void {
    const normalized = this.normalizeSessionId(sessionId);
    const sub = this.subjects.get(normalized);
    if (sub) {
      sub.complete();
      this.subjects.delete(normalized);
    }
  }

  private normalizeSessionId(sessionId: string): string {
    return sessionId.trim().toLowerCase();
  }

  private getSubject(sessionId: string): ReplaySubject<ChatSseEvent> {
    const normalized = this.normalizeSessionId(sessionId);
    let sub = this.subjects.get(normalized);
    if (!sub) {
      sub = new ReplaySubject<ChatSseEvent>(ChatEventsService.REPLAY_BUFFER);
      this.subjects.set(normalized, sub);
    }
    return sub;
  }
}
