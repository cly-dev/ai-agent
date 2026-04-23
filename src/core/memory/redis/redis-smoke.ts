/**
 * 手动冒烟：需要本机 Redis 与 `REDIS_URL` 或 `REDIS_HOST`。
 * `npm run memory:redis-smoke`
 */
import '../../env/load-env';
import Redis from 'ioredis';
import { sessionContextKey, userMemoryKey } from './redis-keys';

function createClient(): Redis {
  const url = process.env.REDIS_URL?.trim();
  const host = process.env.REDIS_HOST?.trim();
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  if (url) {
    return new Redis(url, { password });
  }
  if (host) {
    return new Redis({
      host,
      port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password,
      db: process.env.REDIS_DB
        ? Number.parseInt(process.env.REDIS_DB, 10)
        : undefined,
    });
  }
  throw new Error('Set REDIS_URL or REDIS_HOST');
}

async function main(): Promise<void> {
  const redis = createClient();
  try {
    await redis.ping();
    const uid = 999001;
    const sid = 'a'.repeat(32);
    const uk = userMemoryKey(uid);
    const sk = sessionContextKey(sid);
    await redis.set(uk, JSON.stringify({ test: 'user-memory', v: 1 }), 'EX', 60);
    const gv = await redis.get(uk);
    if (!gv || !gv.includes('user-memory')) {
      throw new Error('user memory roundtrip failed');
    }
    await redis.set(sk, JSON.stringify({ turns: [] }), 'EX', 2);
    await redis.expire(sk, 10);
    const ttl = await redis.ttl(sk);
    if (ttl <= 0) {
      throw new Error('expected positive TTL');
    }
    await redis.del(uk, sk);
    // eslint-disable-next-line no-console
    console.log('redis smoke ok');
  } finally {
    await redis.quit();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
