/**
 * 远程库初始化：授权（可选）→ Prisma migrate → 从本地 Podman PG 导入数据。
 *
 * 用法：
 *   pnpm run db:bootstrap-remote
 *
 * 环境变量：
 *   DATABASE_URL          远程库（应用使用的 omnix 账号）
 *   ADMIN_DATABASE_URL    可选，库 owner（如 appuser）用于 GRANT public 权限
 *   LOCAL_DATABASE_URL    可选，默认 postgresql://user:pass@localhost:5432/agent
 *   LOCAL_PG_CONTAINER    可选，默认 agent-server-postgres（用于 podman pg_dump）
 *   SKIP_DATA_IMPORT=1    只建表，不导数据
 */
import '../../src/core/env/load-env';
import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Client } from 'pg';

const ROOT = resolve(__dirname, '../..');
const DATA_DUMP = resolve(ROOT, 'agent_data_only.sql');

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.username}@${u.hostname}:${u.port || '5432'}${u.pathname}`;
  } catch {
    return '(invalid url)';
  }
}

function parseDbUser(url: string): string {
  return new URL(url).username;
}

async function withClient(
  connectionString: string,
  fn: (client: Client) => Promise<void>,
): Promise<void> {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15_000,
  });
  await client.connect();
  try {
    await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function canCreateOnPublic(connectionString: string): Promise<boolean> {
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15_000,
  });
  await client.connect();
  try {
    const result = await client.query<{ ok: boolean }>(
      `SELECT has_schema_privilege(current_user, 'public', 'CREATE') AS ok`,
    );
    return result.rows[0]?.ok === true;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function grantPublicToAppUser(
  adminUrl: string,
  appUser: string,
  databaseName: string,
): Promise<void> {
  await withClient(adminUrl, async (client) => {
    const statements = [
      `GRANT CONNECT ON DATABASE ${quoteIdent(databaseName)} TO ${quoteIdent(appUser)}`,
      `GRANT ALL ON SCHEMA public TO ${quoteIdent(appUser)}`,
      `GRANT CREATE ON SCHEMA public TO ${quoteIdent(appUser)}`,
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${quoteIdent(appUser)}`,
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${quoteIdent(appUser)}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${quoteIdent(appUser)}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${quoteIdent(appUser)}`,
    ];
    for (const sql of statements) {
      await client.query(sql);
    }
  });
  // eslint-disable-next-line no-console
  console.log(`granted public schema privileges to ${appUser}`);
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function runPrismaMigrateDeploy(databaseUrl: string): void {
  // eslint-disable-next-line no-console
  console.log('running prisma migrate deploy...');
  execSync('pnpm exec prisma migrate deploy', {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}

function exportLocalDataOnly(localUrl: string, container: string): void {
  const usePodman = existsSync('/.dockerenv') === false;
  const u = new URL(localUrl);
  const dbName = u.pathname.replace(/^\//, '') || 'agent';
  const user = u.username || 'user';

  // eslint-disable-next-line no-console
  console.log(`exporting local data from ${container} (db=${dbName})...`);

  const dumpCmd = `pg_dump -U ${shellQuote(user)} -d ${shellQuote(dbName)} --data-only --no-owner --no-acl`;
  let sql: string;
  try {
    sql = execSync(`podman exec ${shellQuote(container)} ${dumpCmd}`, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch {
    sql = execSync(
      `pg_dump ${shellQuote(localUrl)} --data-only --no-owner --no-acl`,
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
  }

  writeFileSync(DATA_DUMP, sql, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`wrote ${DATA_DUMP} (${sql.split('\n').length} lines)`);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function importDataToRemote(remoteUrl: string): void {
  if (!existsSync(DATA_DUMP)) {
    throw new Error(`data dump not found: ${DATA_DUMP}`);
  }

  // eslint-disable-next-line no-console
  console.log(`importing data to ${maskUrl(remoteUrl)}...`);

  const sql = readFileSync(DATA_DUMP, 'utf8');
  try {
    execSync(
      `podman run --rm -i docker.m.daocloud.io/library/postgres:16-alpine psql ${shellQuote(remoteUrl)} -v ON_ERROR_STOP=1`,
      { cwd: ROOT, stdio: ['pipe', 'inherit', 'inherit'], input: sql },
    );
  } catch {
    execSync(`psql ${shellQuote(remoteUrl)} -v ON_ERROR_STOP=1`, {
      cwd: ROOT,
      stdio: ['pipe', 'inherit', 'inherit'],
      input: sql,
    });
  }
}

async function printTableCounts(connectionString: string): Promise<void> {
  await withClient(connectionString, async (client) => {
    const tables = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    // eslint-disable-next-line no-console
    console.log(`remote public tables: ${tables.rows[0]?.count ?? '0'}`);

    const counts = await client.query<{ label: string; count: string }>(`
      SELECT 'User' AS label, count(*)::text AS count FROM "User"
      UNION ALL SELECT 'Agent', count(*)::text FROM "Agent"
      UNION ALL SELECT 'Session', count(*)::text FROM "Session"
      UNION ALL SELECT 'AppClient', count(*)::text FROM "AppClient"
      UNION ALL SELECT 'AdminUser', count(*)::text FROM "AdminUser"
    `);
    for (const row of counts.rows) {
      // eslint-disable-next-line no-console
      console.log(`  ${row.label}: ${row.count}`);
    }
  });
}

async function main(): Promise<void> {
  const remoteUrl = process.env.DATABASE_URL?.trim();
  if (!remoteUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const adminUrl = process.env.ADMIN_DATABASE_URL?.trim();
  const localUrl =
    process.env.LOCAL_DATABASE_URL?.trim() ||
    'postgresql://user:pass@localhost:5432/agent';
  const container =
    process.env.LOCAL_PG_CONTAINER?.trim() || 'agent-server-postgres';
  const skipData = process.env.SKIP_DATA_IMPORT === '1';
  const appUser = parseDbUser(remoteUrl);
  const databaseName =
    new URL(remoteUrl).pathname.replace(/^\//, '') || 'postgres';

  // eslint-disable-next-line no-console
  console.log(`target remote: ${maskUrl(remoteUrl)}`);

  if (adminUrl) {
    // eslint-disable-next-line no-console
    console.log(`admin: ${maskUrl(adminUrl)}`);
    await grantPublicToAppUser(adminUrl, appUser, databaseName);
  }

  const canCreate = await canCreateOnPublic(remoteUrl);
  if (!canCreate) {
    throw new Error(
      [
        `user "${appUser}" cannot CREATE on schema public.`,
        'Fix options:',
        '  1) Set ADMIN_DATABASE_URL to the DB owner (e.g. appuser) and re-run',
        '  2) Ask DBA to run:',
        '     GRANT ALL ON SCHEMA public TO omnix;',
        '     GRANT CREATE ON SCHEMA public TO omnix;',
        '     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO omnix;',
        '     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO omnix;',
      ].join('\n'),
    );
  }

  runPrismaMigrateDeploy(remoteUrl);

  if (!skipData) {
    exportLocalDataOnly(localUrl, container);
    importDataToRemote(remoteUrl);
    unlinkSync(DATA_DUMP);
  }

  await printTableCounts(remoteUrl);
  // eslint-disable-next-line no-console
  console.log('remote db bootstrap ok');
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
