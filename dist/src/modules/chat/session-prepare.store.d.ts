import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import type { RuntimeRevision, SessionAllowedToolsRow, SessionHostToolsPageEntry, SessionPrepareSkillRow, SessionRuntimeSnapshot, SessionRuntimeWriteInput } from './session-prepare.types';
export declare class SessionPrepareStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(sessionId: string, userId: number, appClientId: number, agentId: number, expectedRevision?: RuntimeRevision): Promise<{
        snapshot: SessionRuntimeSnapshot;
        tools: SessionAllowedToolsRow[];
        skills: SessionPrepareSkillRow[];
        hostToolsByPage?: Record<string, SessionHostToolsPageEntry>;
        lastPreparedPage?: string;
        revision: RuntimeRevision;
    } | null>;
    trySet(input: SessionRuntimeWriteInput): Promise<boolean>;
    delete(sessionId: string): Promise<void>;
    invalidateSnapshotsContainingToolIds(toolIds: number[]): Promise<number>;
    invalidateSnapshotsForAgent(agentId: number): Promise<string[]>;
    private scanAndInvalidate;
    private readSessionIdFromKey;
    private getSnapshot;
    private normalizeSnapshot;
    private upgradeLegacySnapshot;
}
