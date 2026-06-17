import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import { buildAuthConfigFromEnv } from '../../src/modules/app-client/auth/app-client-auth.config.util';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

function parseAppClientId(): number {
  const raw = process.argv[2]?.trim() ?? process.env.APP_CLIENT_BACKFILL_ID?.trim();
  if (!raw) {
    throw new Error(
      'usage: ts-node prisma/scripts/backfill-app-client-auth-from-env.ts <appClientId>',
    );
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('appClientId must be a positive integer');
  }
  return id;
}

async function main() {
  const appClientId = parseAppClientId();
  const authConfig = buildAuthConfigFromEnv();
  if (!authConfig) {
    throw new Error('APP_CLIENT_HOST is not set; cannot build authConfig from env');
  }

  const existing = await prisma.appClient.findUnique({
    where: { id: appClientId },
    select: { id: true, name: true, authConfig: true },
  });
  if (!existing) {
    throw new Error(`appClient ${appClientId} not found`);
  }
  if (existing.authConfig !== null) {
    console.log(
      `skip appClient ${appClientId} (${existing.name}): authConfig already set`,
    );
    return;
  }

  const updated = await prisma.appClient.update({
    where: { id: appClientId },
    data: { authConfig },
    select: { id: true, name: true, authConfig: true },
  });

  console.log(
    `updated appClient ${updated.id} (${updated.name}) authConfig from env`,
  );
  console.log(JSON.stringify(updated.authConfig, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
