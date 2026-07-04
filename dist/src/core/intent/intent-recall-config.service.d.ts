import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntentRecallConfigCacheStore } from './intent-recall-config-cache.store';
import type { ResolvedIntentRecallConfig } from './intent-recall-config.types';
export declare class IntentRecallConfigService implements OnModuleInit {
    private readonly prisma;
    private readonly configCache;
    private readonly logger;
    private cached;
    constructor(prisma: PrismaService, configCache: IntentRecallConfigCacheStore);
    onModuleInit(): Promise<void>;
    get(): Promise<ResolvedIntentRecallConfig>;
    refreshCache(): Promise<ResolvedIntentRecallConfig>;
    resolveRecallMode(embeddingConfigured: boolean): Promise<{
        useVector: boolean;
        reason: string;
    }>;
    shouldFallbackToKeywordOnError(): Promise<boolean>;
    private mapRow;
    private resolveFromEnv;
    private parseRecallMode;
    private readPositiveIntEnv;
    private readFloatEnv;
}
