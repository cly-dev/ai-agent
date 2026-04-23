import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

/** SSE 事件：think-思考，result-结果，complete-推送完成，error-推送失败 */
export type ChatSseEvent =
  | { event: 'think'; payload: { content: string } }
  | { event: 'result'; payload: { content: string } }
  | { event: 'complete'; payload: Record<string, unknown> }
  | { event: 'error'; payload: { message: string; code?: string } };

@Injectable()
export class ChatEventsService {
  private readonly subjects = new Map<string, Subject<ChatSseEvent>>();

  observeSession(sessionId: string): Observable<ChatSseEvent> {
    return this.getSubject(sessionId).asObservable();
  }

  emit(sessionId: string, evt: ChatSseEvent): void {
    this.getSubject(sessionId).next(evt);
  }

  closeSession(sessionId: string): void {
    const sub = this.subjects.get(sessionId);
    if (sub) {
      sub.complete();
      this.subjects.delete(sessionId);
    }
  }

  private getSubject(sessionId: string): Subject<ChatSseEvent> {
    let sub = this.subjects.get(sessionId);
    if (!sub) {
      sub = new Subject<ChatSseEvent>();
      this.subjects.set(sessionId, sub);
    }
    return sub;
  }
}
