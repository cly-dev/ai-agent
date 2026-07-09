import { RedisConnectionService } from '../memory/redis/redis-connection.service';
import type { ResolvedPrompt } from './prompt-registry.types';
export declare class PromptTemplateStore {
    private readonly redis;
    private readonly logger;
    constructor(redis: RedisConnectionService);
    isAvailable(): boolean;
    get(key: string, appClientId: number | null | undefined, agentId: number | null | undefined, locale: string): Promise<ResolvedPrompt | null>;
    set(key: string, appClientId: number | null | undefined, agentId: number | null | undefined, locale: string, resolved: ResolvedPrompt): Promise<void>;
    delete(key: string, appClientId: number | null | undefined, agentId: number | null | undefined, locale: string): Promise<void>;
}
