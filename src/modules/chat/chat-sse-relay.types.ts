import type { ChatSseEvent } from './chat-events.service';

/** Redis Pub/Sub 载荷：本实例发出，其它实例订阅后投递本地 SSE。 */
export type ChatSseRelayMessage =
  | {
      kind: 'event';
      originInstanceId: string;
      sessionId: string;
      evt: ChatSseEvent;
    }
  | {
      kind: 'purge_replay';
      originInstanceId: string;
      sessionId: string;
    };
