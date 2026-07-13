import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import type { ResolvedIntentRecallConfig } from './intent-recall-config.types';
export declare class IntentRecallConfigCacheStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(): Promise<ResolvedIntentRecallConfig | null>;
    trySet(config: ResolvedIntentRecallConfig): Promise<boolean>;
    delete(): Promise<void>;
}
