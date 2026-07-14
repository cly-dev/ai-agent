import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import type { AgentSkillCatalogSnapshot } from './runtime-cache.types';
export declare class AgentSkillCatalogStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(appClientId: number, agentId: number, roleId: number): Promise<AgentSkillCatalogSnapshot | null>;
    trySet(snapshot: AgentSkillCatalogSnapshot): Promise<boolean>;
    deleteForAgent(appClientId: number, agentId: number): Promise<number>;
}
