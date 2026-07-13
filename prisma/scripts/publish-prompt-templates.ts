/**
 * 将代码默认 prompt 发版为 global active（并刷新 Redis 缓存）。
 *
 * 用法:
 *   pnpm run db:publish-prompts
 *   pnpm run db:publish-prompts -- agent.tool_decision agent.plan
 *   pnpm run db:publish-prompts -- --all-outdated
 */
import '../../src/core/env/load-env';
import Redis from 'ioredis';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import { buildIoRedisClientOptions } from '../../src/core/memory/redis/redis-client-options.util';
import {
  DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS,
  publishGlobalPromptsFromDefaults,
  toResolvedGlobalPrompt,
} from '../../src/core/prompt/ensure-global-prompt-templates';
import { PROMPT_DEFAULT_CONTENT } from '../../src/core/prompt/prompt-defaults';
import {
  PROMPT_KEY_LIST,
  type PromptTemplateKey,
} from '../../src/core/prompt/prompt-template.keys';
import { promptTemplateActiveKey } from '../../src/core/prompt/redis/prompt-template-keys';

const DEFAULT_LOCALE = 'zh-CN';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

function parseKeys(argv: string[]): PromptTemplateKey[] {
  const allowed = new Set(PROMPT_KEY_LIST);
  const keys: PromptTemplateKey[] = [];
  for (const raw of argv) {
    if (raw === '--all-outdated') {
      continue;
    }
    if (!allowed.has(raw as PromptTemplateKey)) {
      throw new Error(`unknown prompt key: ${raw}`);
    }
    keys.push(raw as PromptTemplateKey);
  }
  return keys;
}

async function resolvePublishKeys(argv: string[]): Promise<PromptTemplateKey[]> {
  if (argv.includes('--all-outdated')) {
    const outdated: PromptTemplateKey[] = [];
    for (const key of PROMPT_KEY_LIST) {
      const active = await prisma.promptTemplate.findFirst({
        where: {
          key,
          appClientId: null,
          agentId: null,
          locale: DEFAULT_LOCALE,
          isActive: true,
        },
        select: { content: true },
      });
      if (!active || active.content !== PROMPT_DEFAULT_CONTENT[key]) {
        outdated.push(key);
      }
    }
    return outdated;
  }

  const explicit = parseKeys(argv);
  return explicit.length > 0 ? explicit : DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS;
}

async function syncPublishedRowsToRedis(
  templateIds: number[],
): Promise<void> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl || templateIds.length === 0) {
    return;
  }

  const rows = await prisma.promptTemplate.findMany({
    where: { id: { in: templateIds } },
  });
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  const redis = new Redis(redisUrl, buildIoRedisClientOptions({ password }));
  try {
    await redis.connect();
    for (const row of rows) {
      const redisKey = promptTemplateActiveKey(
        row.key,
        row.appClientId,
        row.agentId,
        row.locale,
      );
      await redis.set(redisKey, JSON.stringify(toResolvedGlobalPrompt(row)));
      console.log(`redis synced: ${redisKey}`);
    }
  } finally {
    redis.disconnect();
  }
}

async function main(): Promise<void> {
  const keys = await resolvePublishKeys(process.argv.slice(2));
  if (keys.length === 0) {
    console.log('no prompt keys to publish');
    return;
  }

  console.log(`publishing ${keys.length} key(s): ${keys.join(', ')}`);
  const result = await publishGlobalPromptsFromDefaults(prisma, {
    keys,
    locale: DEFAULT_LOCALE,
    onlyIfOutdated: true,
  });

  for (const row of result.published) {
    console.log(
      `published ${row.key} v${row.version} (templateId=${row.templateId})`,
    );
  }
  for (const key of result.unchanged) {
    console.log(`unchanged (already matches defaults): ${key}`);
  }
  for (const key of result.missing) {
    console.log(`missing default content: ${key}`);
  }

  await syncPublishedRowsToRedis(
    result.published.map((row) => row.templateId),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
