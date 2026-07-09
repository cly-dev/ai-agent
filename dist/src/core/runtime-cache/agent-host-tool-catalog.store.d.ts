import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import type { AgentHostToolCatalogSnapshot } from './runtime-cache.types';
export declare class AgentHostToolCatalogStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(appClientId: number, agentId: number): Promise<AgentHostToolCatalogSnapshot | null>;
    trySet(snapshot: AgentHostToolCatalogSnapshot): Promise<boolean>;
    delete(appClientId: number, agentId: number): Promise<void>;
}
