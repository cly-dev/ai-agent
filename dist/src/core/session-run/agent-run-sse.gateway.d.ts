import type { HostActionSsePayload } from '../host-bridge/host-action.types';
import type { WriteDraftPublic } from '../draft-review/write-draft.types';
import { RunEventPublisher } from './run-event.publisher';
import type { SessionRunCoordinator } from './session-run-coordinator.service';
export declare class AgentRunSseGateway {
    private readonly coordinator;
    private readonly runEvents;
    constructor(coordinator: SessionRunCoordinator, runEvents: RunEventPublisher);
    getBoundRunGeneration(sessionId: string, runId: number): number | null;
    getRunAbortSignal(sessionId: string, runId: number): AbortSignal | undefined;
    throwIfAborted(sessionId: string, runId: number, generation: number): void;
    canPublishRun(sessionId: string, runId: number): boolean;
    purgeWriteConfirmationGate(sessionId: string, runId: number): void;
    private canEmit;
    private boundGeneration;
    emitThink(sessionId: string, runId: number | undefined, input: {
        content: string;
        mode?: 'delta' | 'replace';
    }): boolean;
    emitAgentRunMessage(sessionId: string, runId: number | undefined, payload: Record<string, unknown> & {
        source: 'agent-run';
        runId?: number;
    }): boolean;
    emitHostAction(sessionId: string, runId: number | undefined, payload: HostActionSsePayload): boolean;
    emitConfirmationRequired(sessionId: string, input: {
        runId: number;
        turnId?: number;
        message: string;
        draftRetryCount?: number;
        draftRetryMax?: number;
        canRetry?: boolean;
        writeDraft?: WriteDraftPublic;
        writeDrafts?: WriteDraftPublic[];
    }): boolean;
    emitRunComplete(sessionId: string, input: {
        runId: number;
        turnId?: number;
        status: string;
        reason?: string;
    }): boolean;
    emitWriteConfirmationCancelled(sessionId: string, input: {
        runId: number;
        turnId?: number;
        message: string;
    }): void;
    emitRunError(sessionId: string, input: {
        message: string;
        code?: string;
        generation: number;
    }): boolean;
    emitWriteConfirmationExpired(sessionId: string): void;
}
