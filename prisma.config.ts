// Prisma CLI 配置。Docker 内 DATABASE_URL 由 entrypoint / --env-file 注入，不依赖 src/。
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config as dotenvConfig } from 'dotenv';
import { defineConfig } from 'prisma/config';

const root = process.cwd();

/** 本地 CLI：无 DATABASE_URL 时读 .env.test / .env.prod / .env */
function bootstrapPrismaEnv(): void {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  const envFile =
    nodeEnv === 'test'
      ? '.env.test'
      : nodeEnv === 'prod' || nodeEnv === 'production'
        ? '.env.prod'
        : null;
  for (const name of [envFile, '.env']) {
    if (!name) {
      continue;
    }
    const envPath = join(root, name);
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath });
      if (process.env.DATABASE_URL?.trim()) {
        return;
      }
    }
  }
}

bootstrapPrismaEnv();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
