import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SessionRunStateStore } from '../memory/session-run/session-run-state.store';
import type { SessionRunCoordinator } from './session-run-coordinator.service';
import type { RunJob } from './session-run.types';
export type SessionRunBullMqJobData = {
    runJob: RunJob;
};
export declare class SessionRunJobQueueService implements OnModuleInit, OnModuleDestroy {
    private readonly runState;
    private readonly coordinator;
    private readonly logger;
    private queue;
    private worker;
    constructor(runState: SessionRunStateStore, coordinator: SessionRunCoordinator);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    isEnabled(): boolean;
    enqueue(job: RunJob): Promise<void>;
    clearSession(sessionId: string): Promise<void>;
    countSession(sessionId: string): Promise<number>;
}
