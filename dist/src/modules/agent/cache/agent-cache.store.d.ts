import { RedisConnectionService } from '../../../core/memory/redis/redis-connection.service';
import type { AgentRuntimeSnapshot } from './agent-runtime.types';
export declare class AgentCacheStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(appClientId: number, agentId: number): Promise<AgentRuntimeSnapshot | null>;
    trySet(appClientId: number, agentId: number, snapshot: AgentRuntimeSnapshot): Promise<boolean>;
    delete(appClientId: number, agentId: number): Promise<void>;
}
