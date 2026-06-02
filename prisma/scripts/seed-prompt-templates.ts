/**
 * 补齐缺失的全局提示词（不覆盖已有 active 行）。
 * 用法: pnpm run db:seed-prompts
 */
import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import { ensureGlobalPromptTemplates } from '../../src/core/prompt/ensure-global-prompt-templates';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

async function main(): Promise<void> {
  const { created, skipped } = await ensureGlobalPromptTemplates(prisma);
  for (const key of created) {
    console.log(`created global prompt: ${key}`);
  }
  for (const key of skipped) {
    console.log(`skipped (already active): ${key}`);
  }
  if (created.length === 0) {
    console.log('all prompt keys already present in DB');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
