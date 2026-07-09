export declare function readRedisConnectTimeoutMs(): number;
export declare function buildIoRedisClientOptions(input?: {
    password?: string;
}): {
    maxRetriesPerRequest: number;
    connectTimeout: number;
    commandTimeout: number;
    lazyConnect: true;
    password?: string;
};
