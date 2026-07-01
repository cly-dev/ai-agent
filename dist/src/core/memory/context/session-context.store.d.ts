import { RedisConnectionService } from '../redis/redis-connection.service';
import type { SessionContextPayload } from './session-context.types';
export declare class SessionContextStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(sessionId: string): Promise<Record<string, unknown> | null>;
    set(sessionId: string, payload: Record<string, unknown>, ttlSeconds?: number): Promise<void>;
    trySet(sessionId: string, payload: SessionContextPayload, ttlSeconds?: number): Promise<boolean>;
    patch(sessionId: string, partial: Record<string, unknown>, ttlSeconds?: number): Promise<Record<string, unknown>>;
    patchMerge(sessionId: string, merge: (current: Record<string, unknown>) => Record<string, unknown>, ttlSeconds?: number): Promise<Record<string, unknown>>;
    tryPatch(sessionId: string, partial: Record<string, unknown>, ttlSeconds?: number): Promise<Record<string, unknown> | null>;
    tryPatchMerge(sessionId: string, merge: (current: Record<string, unknown>) => Record<string, unknown>, ttlSeconds?: number): Promise<Record<string, unknown> | null>;
    touch(sessionId: string, ttlSeconds?: number): Promise<void>;
    delete(sessionId: string): Promise<void>;
    private requireClient;
}
