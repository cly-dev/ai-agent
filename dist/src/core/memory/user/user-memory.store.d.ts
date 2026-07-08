import { RedisConnectionService } from '../redis/redis-connection.service';
export declare class UserMemoryStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    get(userId: number): Promise<Record<string, unknown> | null>;
    set(userId: number, payload: Record<string, unknown>, ttlSeconds?: number): Promise<void>;
    delete(userId: number): Promise<void>;
    private requireClient;
}
