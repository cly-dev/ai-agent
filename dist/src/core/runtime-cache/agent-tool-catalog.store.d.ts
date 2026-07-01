import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import type { AgentToolCatalogSnapshot } from './runtime-cache.types';
export declare class AgentToolCatalogStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(appClientId: number, agentId: number): Promise<AgentToolCatalogSnapshot | null>;
    trySet(snapshot: AgentToolCatalogSnapshot): Promise<boolean>;
    delete(appClientId: number, agentId: number): Promise<void>;
}
