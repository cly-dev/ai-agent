/**
 * 删除已废弃 PromptTemplate 行（不在 PROMPT_KEY_LIST 内或历史残留 key），并清理 Redis。
 *
 * 用法: pnpm run db:delete-obsolete-prompts
 */
import '../../src/core/env/load-env';
import Redis from 'ioredis';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import { PROMPT_KEY_LIST } from '../../src/core/prompt/prompt-template.keys';
import { promptTemplateActiveKey } from '../../src/core/prompt/redis/prompt-template-keys';

const ALLOWED_KEYS = new Set<string>(PROMPT_KEY_LIST);

/** 从未纳入 PROMPT_KEYS 的残留 key 片段（全量删除匹配行）。 */
const OBSOLETE_KEY_FRAGMENTS = [
  'precheck',
  'working_memory_refresh',
] as const;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

function isObsoletePromptKey(key: string): boolean {
  if (!ALLOWED_KEYS.has(key)) {
    return true;
  }
  return OBSOLETE_KEY_FRAGMENTS.some((fragment) => key.includes(fragment));
}

async function clearRedisPromptCache(
  rows: Array<{
    key: string;
    appClientId: number | null;
    agentId: number | null;
    locale: string;
  }>,
): Promise<number> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl || rows.length === 0) {
    return 0;
  }

  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  let cleared = 0;
  try {
    await redis.connect();
    const seen = new Set<string>();
    for (const row of rows) {
      const redisKey = promptTemplateActiveKey(
        row.key,
        row.appClientId,
        row.agentId,
        row.locale,
      );
      if (seen.has(redisKey)) {
        continue;
      }
      seen.add(redisKey);
      const deleted = await redis.del(redisKey);
      if (deleted > 0) {
        cleared += deleted;
        console.log(`redis del: ${redisKey}`);
      }
    }
  } finally {
    redis.disconnect();
  }
  return cleared;
}

async function main(): Promise<void> {
  const allRows = await prisma.promptTemplate.findMany({
    select: {
      id: true,
      key: true,
      version: true,
      locale: true,
      appClientId: true,
      agentId: true,
      isActive: true,
    },
    orderBy: [{ key: 'asc' }, { version: 'asc' }],
  });

  const obsolete = allRows.filter((row) => isObsoletePromptKey(row.key));

  if (obsolete.length === 0) {
    console.log('no obsolete prompt templates found');
    console.log(`allowed keys (${ALLOWED_KEYS.size}): ${[...ALLOWED_KEYS].join(', ')}`);
    return;
  }

  for (const row of obsolete) {
    console.log(
      `will delete #${row.id} key=${row.key} v${row.version} active=${row.isActive}`,
    );
  }

  const redisCleared = await clearRedisPromptCache(obsolete);
  const deleted = await prisma.promptTemplate.deleteMany({
    where: { id: { in: obsolete.map((row) => row.id) } },
  });

  console.log(
    `deleted PromptTemplate rows=${deleted.count}, redis keys cleared=${redisCleared}`,
  );
  console.log(`remaining allowed keys (${ALLOWED_KEYS.size}): ${[...ALLOWED_KEYS].join(', ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
