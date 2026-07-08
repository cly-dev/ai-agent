import type { LlmModelConfig, LlmModelKind } from '../../../generated/prisma/client';
import { RedisConnectionService } from '../memory/redis/redis-connection.service';
export declare class LlmModelConfigCacheStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    getActive(kind: LlmModelKind): Promise<LlmModelConfig | null>;
    trySetActive(config: LlmModelConfig): Promise<boolean>;
    deleteActive(kind: LlmModelKind): Promise<void>;
}
