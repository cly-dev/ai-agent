import type { ChatSseEvent } from './chat-events.service';
export type ChatSseRelayMessage = {
    kind: 'event';
    originInstanceId: string;
    sessionId: string;
    evt: ChatSseEvent;
} | {
    kind: 'purge_replay';
    originInstanceId: string;
    sessionId: string;
};
