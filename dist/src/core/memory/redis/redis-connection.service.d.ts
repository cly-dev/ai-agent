import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisConnectionService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private client;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    getClient(): Redis | null;
    ping(): Promise<{
        ok: boolean;
        configured: boolean;
        error?: string;
    }>;
}
