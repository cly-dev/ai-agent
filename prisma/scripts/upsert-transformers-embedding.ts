/**
 * 将本地 transformers embedding 写入 LlmModelConfig（kind=transformers_embedding）。
 * 用法: pnpm exec ts-node prisma/scripts/upsert-transformers-embedding.ts
 */
import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

const MODEL_URL =
  process.env.AGENT_EMBEDDING_LOCAL_MODEL?.trim() ||
  'https://media.cdn.a-premium.com/static/models/all-MiniLM-L6-v2';
const ALLOW_REMOTE =
  process.env.AGENT_EMBEDDING_LOCAL_ALLOW_REMOTE?.trim() !== 'false';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

async function main(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "LlmModelConfig" DROP CONSTRAINT IF EXISTS "LlmModelConfig_singletonKey_key"`,
  );

  const existing = await prisma.llmModelConfig.findFirst({
    where: { kind: 'transformers_embedding' },
    orderBy: { id: 'asc' },
  });
  const row = existing
    ? await prisma.llmModelConfig.update({
        where: { id: existing.id },
        data: {
          model: MODEL_URL,
          parameters: { allowRemoteModels: ALLOW_REMOTE },
          enabled: true,
        },
      })
    : await prisma.llmModelConfig.create({
        data: {
          kind: 'transformers_embedding',
          singletonKey: null,
          provider: 'transformers.js',
          model: MODEL_URL,
          apiKey: null,
          baseUrl: 'local',
          chatPath: '/v1/embeddings',
          parameters: { allowRemoteModels: ALLOW_REMOTE },
          stream: false,
          enabled: true,
        },
      });

  await prisma.intentRecallConfig.upsert({
    where: { singletonKey: 1 },
    create: {
      singletonKey: 1,
      recallMode: 'auto',
      vectorTopK: 10,
      vectorMinScore: 0.25,
      bindToolsMax: 25,
      fallbackToKeyword: true,
    },
    update: {
      recallMode: 'auto',
      fallbackToKeyword: true,
    },
  });

  console.log('transformers_embedding upserted:', {
    id: row.id,
    kind: row.kind,
    model: row.model,
    allowRemoteModels: ALLOW_REMOTE,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
