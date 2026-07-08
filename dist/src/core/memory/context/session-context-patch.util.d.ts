import type Redis from 'ioredis';
export declare function atomicShallowPatchSessionContext(input: {
    client: Redis;
    key: string;
    partial: Record<string, unknown>;
    ttlSeconds: number;
    maxRetries?: number;
    onCorruptJson?: () => void;
}): Promise<Record<string, unknown>>;
export declare function atomicMergePatchSessionContext(input: {
    client: Redis;
    key: string;
    ttlSeconds: number;
    maxRetries?: number;
    onCorruptJson?: () => void;
    merge: (current: Record<string, unknown>) => Record<string, unknown>;
}): Promise<Record<string, unknown>>;
