import { LlmService } from '../../core/llm/llm.service';
import { RedisConnectionService } from '../../core/memory/redis/redis-connection.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { ConnectivityBatchResult, ConnectivityCheckResult, ConnectivityCheckTarget } from './connectivity.types';
export declare class ConnectivityService {
    private readonly prisma;
    private readonly redisConnection;
    private readonly llmService;
    constructor(prisma: PrismaService, redisConnection: RedisConnectionService, llmService: LlmService);
    checkDatabase(): Promise<ConnectivityCheckResult>;
    checkRedis(): Promise<ConnectivityCheckResult>;
    checkLlmChat(): Promise<ConnectivityCheckResult>;
    checkLlmEmbedding(): Promise<ConnectivityCheckResult>;
    runBatch(targets?: ConnectivityCheckTarget[]): Promise<ConnectivityBatchResult>;
}
