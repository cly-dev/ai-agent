/** 避免本地 Redis/Podman 假连通时阻塞 Nest 启动（HTTP 永远 listen 不了）。 */
export function readRedisConnectTimeoutMs(): number {
  const raw = process.env.REDIS_CONNECT_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : 5000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

export function buildIoRedisClientOptions(
  input: { password?: string } = {},
): {
  maxRetriesPerRequest: number;
  connectTimeout: number;
  commandTimeout: number;
  lazyConnect: true;
  password?: string;
} {
  return {
    maxRetriesPerRequest: 2,
    connectTimeout: readRedisConnectTimeoutMs(),
    commandTimeout: readRedisConnectTimeoutMs(),
    lazyConnect: true,
    ...(input.password ? { password: input.password } : {}),
  };
}
