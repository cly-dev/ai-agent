import type { HostActionSsePayload } from '../host-bridge/host-action.types';
export declare abstract class RunEventPublisher {
    abstract purgeReplayForSession(sessionId: string): void;
    abstract purgeWriteConfirmationGate(sessionId: string, runId: number): void;
    abstract emitRunAborted(sessionId: string, input: {
        runId: number;
        turnId?: number;
        generation: number;
        reason: 'cancelled' | 'superseded';
    }): void;
    abstract emitAgentRunError(sessionId: string, input: {
        message: string;
        code?: string;
        generation: number;
    }): void;
    abstract emitAgentRunComplete(sessionId: string, input: {
        runId: number;
        turnId?: number;
        status: string;
        generation?: number;
        reason?: string;
    }): void;
    abstract emitConfirmationRequired(sessionId: string, input: {
        runId: number;
        turnId?: number;
        message: string;
        generation?: number;
    }): void;
    abstract emitWriteConfirmationCancelled(sessionId: string, input: {
        runId: number;
        turnId?: number;
        message: string;
        generation?: number;
    }): void;
    abstract emitThink(sessionId: string, payload: {
        content: string;
        mode?: 'delta' | 'replace';
        runId?: number;
        generation?: number;
    }): void;
    abstract emitAgentRunMessage(sessionId: string, payload: Record<string, unknown> & {
        source: 'agent-run';
        runId?: number;
        generation?: number;
    }): void;
    abstract emitHostAction(sessionId: string, payload: HostActionSsePayload): void;
}
