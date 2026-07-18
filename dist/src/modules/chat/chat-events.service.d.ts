import { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import type { HostActionSsePayload } from '../../core/host-bridge/host-action.types';
import type { MessageBlock, MessageBlockPatch } from '../../core/agent-engine/engine/message/message-blocks.types';
import type { WriteDraftEditPolicy, WriteDraftPublic } from '../../core/draft-review/write-draft.types';
import { PendingWriteConfirmationStore } from './pending-write-confirmation.store';
import { PrismaService } from '../../prisma/prisma.service';
type EmitOptions = {
    fromRelay?: boolean;
};
export type ChatSseEvent = {
    event: 'think';
    payload: {
        content: string;
        mode?: 'delta' | 'replace';
        runId?: number;
        generation?: number;
    };
} | {
    event: 'message';
    payload: {
        source: 'agent-run';
        action: 'stream' | 'patch';
        runId?: number;
        turnId?: number;
        blocks?: MessageBlock[];
        patches?: MessageBlockPatch[];
        output?: string;
        code?: string;
        seq?: number;
        mode?: 'delta' | 'full';
        generation?: number;
    } | {
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
        editPolicy?: WriteDraftEditPolicy | null;
        editPolicies?: WriteDraftEditPolicy[];
    } | {
        source: 'agent-run';
        action: 'write_confirmation_cancelled';
        runId?: number;
        turnId?: number;
        message: string;
        generation?: number;
    } | {
        source: 'message';
        action: 'created' | 'updated' | 'deleted';
        message?: Record<string, unknown>;
        id?: number;
    } | Record<string, unknown>;
} | {
    event: 'complete';
    payload: Record<string, unknown>;
} | {
    event: 'host_action';
    payload: HostActionSsePayload;
} | {
    event: 'error';
    payload: {
        message: string;
        code?: string;
        generation?: number;
    };
};
export declare class ChatEventsService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly pendingWriteConfirmationStore;
    private readonly redis;
    private readonly prisma;
    private static readonly REPLAY_BUFFER;
    private static readonly SSE_HEARTBEAT_MS;
    private readonly logger;
    private readonly instanceId;
    private readonly subjects;
    private readonly replayBuffers;
    private subscriber;
    constructor(pendingWriteConfirmationStore: PendingWriteConfirmationStore, redis: RedisConnectionService, prisma: PrismaService);
    onApplicationBootstrap(): void;
    onModuleDestroy(): void;
    isRelayEnabled(): boolean;
    observeSession(sessionId: string, userId: number): Observable<ChatSseEvent>;
    emit(sessionId: string, evt: ChatSseEvent, options?: EmitOptions): void;
    private deliverLocal;
    purgeReplayForSession(sessionId: string, options?: EmitOptions): void;
    emitRunAborted(sessionId: string, input: {
        runId: number;
        turnId?: number;
        generation: number;
        reason: 'cancelled' | 'superseded';
    }): void;
    purgeWriteConfirmationGate(sessionId: string, runId: number): void;
    closeSession(sessionId: string): void;
    private getReplayEvents;
    private shouldBufferForReplay;
    private shouldReplayOnConnect;
    private isWriteConfirmationGateEventForRun;
    private buildPendingWriteConfirmationEvent;
    private normalizeSessionId;
    private getSubject;
    private publishRelay;
    private handleRelayMessage;
}
export {};
