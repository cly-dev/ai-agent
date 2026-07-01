import type { HostActionSsePayload } from '../../core/host-bridge/host-action.types';
import { RunEventPublisher } from '../../core/session-run/run-event.publisher';
import { ChatEventsService } from './chat-events.service';
export declare class ChatRunEventPublisher extends RunEventPublisher {
    private readonly chatEvents;
    constructor(chatEvents: ChatEventsService);
    purgeReplayForSession(sessionId: string): void;
    purgeWriteConfirmationGate(sessionId: string, runId: number): void;
    emitRunAborted(sessionId: string, input: {
        runId: number;
        turnId?: number;
        generation: number;
        reason: 'cancelled' | 'superseded';
    }): void;
    emitAgentRunError(sessionId: string, input: {
        message: string;
        code?: string;
        generation: number;
    }): void;
    emitAgentRunComplete(sessionId: string, input: {
        runId: number;
        turnId?: number;
        status: string;
        generation?: number;
        reason?: string;
    }): void;
    emitConfirmationRequired(sessionId: string, input: {
        runId: number;
        turnId?: number;
        message: string;
        generation?: number;
    }): void;
    emitWriteConfirmationCancelled(sessionId: string, input: {
        runId: number;
        turnId?: number;
        message: string;
        generation?: number;
    }): void;
    emitThink(sessionId: string, payload: {
        content: string;
        mode?: 'delta' | 'replace';
        runId?: number;
        generation?: number;
    }): void;
    emitAgentRunMessage(sessionId: string, payload: Record<string, unknown> & {
        source: 'agent-run';
        runId?: number;
        generation?: number;
    }): void;
    emitHostAction(sessionId: string, payload: HostActionSsePayload): void;
}
