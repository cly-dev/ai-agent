/**
 * 手动冒烟：校验 `.env` 中的 PostgreSQL 与 Redis 是否可连。
 * `pnpm run db:smoke`
 */
import '../env/load-env';
import { Client } from 'pg';
import Redis from 'ioredis';

const CONNECT_TIMEOUT_MS = 10_000;

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const user = parsed.username || '(none)';
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    const db = parsed.pathname.replace(/^\//, '') || '(none)';
    return `${user}@${host}:${port}/${db}`;
  } catch {
    return '(invalid DATABASE_URL)';
  }
}

function createRedisClient(): Redis {
  const url = process.env.REDIS_URL?.trim();
  const host = process.env.REDIS_HOST?.trim();
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  const options = {
    password,
    connectTimeout: CONNECT_TIMEOUT_MS,
    maxRetriesPerRequest: 1,
    db: process.env.REDIS_DB
      ? Number.parseInt(process.env.REDIS_DB, 10)
      : undefined,
  };
  if (url) {
    return new Redis(url, options);
  }
  if (host) {
    return new Redis({
      host,
      port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
      ...options,
    });
  }
  throw new Error('Set REDIS_URL or REDIS_HOST');
}

async function smokePostgres(): Promise<void> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  const started = Date.now();
  try {
    await client.connect();
    const result = await client.query<{
      db: string;
      usr: string;
    }>('SELECT current_database() AS db, current_user AS usr');
    const row = result.rows[0];
    // eslint-disable-next-line no-console
    console.log(
      `postgres ok (${Date.now() - started}ms) target=${maskDatabaseUrl(connectionString)} db=${row?.db ?? '?'} user=${row?.usr ?? '?'}`,
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function smokeRedis(): Promise<void> {
  const redis = createRedisClient();
  const started = Date.now();
  try {
    const pong = await redis.ping();
    if (pong !== 'PONG') {
      throw new Error(`unexpected ping response: ${pong}`);
    }
    const target =
      process.env.REDIS_URL?.trim() ||
      `${process.env.REDIS_HOST}:${process.env.REDIS_PORT ?? '6379'}`;
    // eslint-disable-next-line no-console
    console.log(
      `redis ok (${Date.now() - started}ms) target=${target} db=${process.env.REDIS_DB ?? '0'}`,
    );
  } finally {
    await redis.quit().catch(() => undefined);
  }
}

async function main(): Promise<void> {
  let failed = false;

  try {
    await smokePostgres();
  } catch (error) {
    failed = true;
    const reason = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`postgres fail: ${reason}`);
  }

  try {
    await smokeRedis();
  } catch (error) {
    failed = true;
    const reason = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`redis fail: ${reason}`);
  }

  if (failed) {
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('db smoke ok');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
