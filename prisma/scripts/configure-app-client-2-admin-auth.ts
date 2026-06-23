import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';
import {
  buildAppClient2AdminAuthConfig,
  resolveAgentServerPublicUrl,
} from '../../src/modules/app-client/auth/app-client-auth.config.util';

const DEFAULT_APP_CLIENT_ID = 2;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

function parseCliArgs(): { appClientId: number; force: boolean } {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const positional = args.filter((arg) => !arg.startsWith('-'));
  const raw =
    positional[0]?.trim() ??
    process.env.APP_CLIENT_ADMIN_AUTH_ID?.trim() ??
    String(DEFAULT_APP_CLIENT_ID);
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      'appClientId must be a positive integer (usage: npm run db:configure-app-client-2-auth -- [--force] | npm run db:configure-app-client-2-auth -- <id> [--force])',
    );
  }
  return { appClientId: id, force };
}

async function main() {
  const { appClientId, force } = parseCliArgs();
  const authConfig = buildAppClient2AdminAuthConfig();
  const publicUrl = resolveAgentServerPublicUrl();

  const existing = await prisma.appClient.findUnique({
    where: { id: appClientId },
    select: { id: true, name: true, dsn: true, authConfig: true },
  });
  if (!existing) {
    throw new Error(`appClient ${appClientId} not found`);
  }
  if (existing.authConfig !== null && !force) {
    console.log(
      `skip appClient ${appClientId} (${existing.name}): authConfig already set; pass --force to overwrite`,
    );
    return;
  }

  const updated = await prisma.appClient.update({
    where: { id: appClientId },
    data: { authConfig },
    select: { id: true, name: true, dsn: true, authConfig: true },
  });

  console.log(
    `updated appClient ${updated.id} (${updated.name}) authConfig for admin B-end`,
  );
  console.log(`publicUrl=${publicUrl}`);
  console.log(`profile=${publicUrl}/admin/admin-user/me`);
  console.log(`dsn=${updated.dsn}`);
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
