import { PrismaService } from '../../../prisma/prisma.service';
import { RedisConnectionService } from '../redis/redis-connection.service';
import { SessionContextStore } from '../context/session-context.store';
import { SessionGoaReplayService } from './session-goa-replay.service';
import { type SessionGoaPayload } from './session-goa.types';
export declare class SessionGoaStore {
    private readonly prisma;
    private readonly redis;
    private readonly sessionContextStore;
    private readonly replayService;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisConnectionService, sessionContextStore: SessionContextStore, replayService: SessionGoaReplayService);
    get(sessionId: string): Promise<SessionGoaPayload>;
    warm(sessionId: string): Promise<SessionGoaPayload>;
    save(sessionId: string, payload: SessionGoaPayload): Promise<void>;
    saveIfUnchanged(sessionId: string, payload: SessionGoaPayload, expectedUpdatedAt: string): Promise<boolean>;
    delete(sessionId: string): Promise<void>;
    private readFromDb;
    private syncCacheFromDb;
    private migrateFromLegacyRedis;
    private readCache;
    private writeCache;
    private invalidateCache;
}
