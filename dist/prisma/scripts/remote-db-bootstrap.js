"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const pg_1 = require("pg");
const ROOT = (0, path_1.resolve)(__dirname, '../..');
const DATA_DUMP = (0, path_1.resolve)(ROOT, 'agent_data_only.sql');
function maskUrl(url) {
    try {
        const u = new URL(url);
        return `${u.username}@${u.hostname}:${u.port || '5432'}${u.pathname}`;
    }
    catch (_a) {
        return '(invalid url)';
    }
}
function parseDbUser(url) {
    return new URL(url).username;
}
async function withClient(connectionString, fn) {
    const client = new pg_1.Client({
        connectionString,
        connectionTimeoutMillis: 15000,
    });
    await client.connect();
    try {
        await fn(client);
    }
    finally {
        await client.end().catch(() => undefined);
    }
}
async function canCreateOnPublic(connectionString) {
    var _a;
    const client = new pg_1.Client({
        connectionString,
        connectionTimeoutMillis: 15000,
    });
    await client.connect();
    try {
        const result = await client.query(`SELECT has_schema_privilege(current_user, 'public', 'CREATE') AS ok`);
        return ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.ok) === true;
    }
    finally {
        await client.end().catch(() => undefined);
    }
}
async function grantPublicToAppUser(adminUrl, appUser, databaseName) {
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
    console.log(`granted public schema privileges to ${appUser}`);
}
function quoteIdent(name) {
    return `"${name.replace(/"/g, '""')}"`;
}
function runPrismaMigrateDeploy(databaseUrl) {
    console.log('running prisma migrate deploy...');
    (0, child_process_1.execSync)('pnpm exec prisma migrate deploy', {
        cwd: ROOT,
        stdio: 'inherit',
        env: Object.assign(Object.assign({}, process.env), { DATABASE_URL: databaseUrl }),
    });
}
function exportLocalDataOnly(localUrl, container) {
    const usePodman = (0, fs_1.existsSync)('/.dockerenv') === false;
    const u = new URL(localUrl);
    const dbName = u.pathname.replace(/^\//, '') || 'agent';
    const user = u.username || 'user';
    console.log(`exporting local data from ${container} (db=${dbName})...`);
    const dumpCmd = `pg_dump -U ${shellQuote(user)} -d ${shellQuote(dbName)} --data-only --no-owner --no-acl`;
    let sql;
    try {
        sql = (0, child_process_1.execSync)(`podman exec ${shellQuote(container)} ${dumpCmd}`, {
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024,
        });
    }
    catch (_a) {
        sql = (0, child_process_1.execSync)(`pg_dump ${shellQuote(localUrl)} --data-only --no-owner --no-acl`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    }
    (0, fs_1.writeFileSync)(DATA_DUMP, sql, 'utf8');
    console.log(`wrote ${DATA_DUMP} (${sql.split('\n').length} lines)`);
}
function shellQuote(value) {
    return `'${value.replace(/'/g, `'\\''`)}'`;
}
function importDataToRemote(remoteUrl) {
    if (!(0, fs_1.existsSync)(DATA_DUMP)) {
        throw new Error(`data dump not found: ${DATA_DUMP}`);
    }
    console.log(`importing data to ${maskUrl(remoteUrl)}...`);
    const sql = (0, fs_1.readFileSync)(DATA_DUMP, 'utf8');
    try {
        (0, child_process_1.execSync)(`podman run --rm -i docker.m.daocloud.io/library/postgres:16-alpine psql ${shellQuote(remoteUrl)} -v ON_ERROR_STOP=1`, { cwd: ROOT, stdio: ['pipe', 'inherit', 'inherit'], input: sql });
    }
    catch (_a) {
        (0, child_process_1.execSync)(`psql ${shellQuote(remoteUrl)} -v ON_ERROR_STOP=1`, {
            cwd: ROOT,
            stdio: ['pipe', 'inherit', 'inherit'],
            input: sql,
        });
    }
}
async function printTableCounts(connectionString) {
    await withClient(connectionString, async (client) => {
        var _a, _b;
        const tables = await client.query(`SELECT count(*)::text AS count FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`);
        console.log(`remote public tables: ${(_b = (_a = tables.rows[0]) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : '0'}`);
        const counts = await client.query(`
      SELECT 'User' AS label, count(*)::text AS count FROM "User"
      UNION ALL SELECT 'Agent', count(*)::text FROM "Agent"
      UNION ALL SELECT 'Session', count(*)::text FROM "Session"
      UNION ALL SELECT 'AppClient', count(*)::text FROM "AppClient"
      UNION ALL SELECT 'AdminUser', count(*)::text FROM "AdminUser"
    `);
        for (const row of counts.rows) {
            console.log(`  ${row.label}: ${row.count}`);
        }
    });
}
async function main() {
    var _a, _b, _c, _d;
    const remoteUrl = (_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (!remoteUrl) {
        throw new Error('DATABASE_URL is required');
    }
    const adminUrl = (_b = process.env.ADMIN_DATABASE_URL) === null || _b === void 0 ? void 0 : _b.trim();
    const localUrl = ((_c = process.env.LOCAL_DATABASE_URL) === null || _c === void 0 ? void 0 : _c.trim()) ||
        'postgresql://user:pass@localhost:5432/agent';
    const container = ((_d = process.env.LOCAL_PG_CONTAINER) === null || _d === void 0 ? void 0 : _d.trim()) || 'agent-server-postgres';
    const skipData = process.env.SKIP_DATA_IMPORT === '1';
    const appUser = parseDbUser(remoteUrl);
    const databaseName = new URL(remoteUrl).pathname.replace(/^\//, '') || 'postgres';
    console.log(`target remote: ${maskUrl(remoteUrl)}`);
    if (adminUrl) {
        console.log(`admin: ${maskUrl(adminUrl)}`);
        await grantPublicToAppUser(adminUrl, appUser, databaseName);
    }
    const canCreate = await canCreateOnPublic(remoteUrl);
    if (!canCreate) {
        throw new Error([
            `user "${appUser}" cannot CREATE on schema public.`,
            'Fix options:',
            '  1) Set ADMIN_DATABASE_URL to the DB owner (e.g. appuser) and re-run',
            '  2) Ask DBA to run:',
            '     GRANT ALL ON SCHEMA public TO omnix;',
            '     GRANT CREATE ON SCHEMA public TO omnix;',
            '     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO omnix;',
            '     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO omnix;',
        ].join('\n'));
    }
    runPrismaMigrateDeploy(remoteUrl);
    if (!skipData) {
        exportLocalDataOnly(localUrl, container);
        importDataToRemote(remoteUrl);
        (0, fs_1.unlinkSync)(DATA_DUMP);
    }
    await printTableCounts(remoteUrl);
    console.log('remote db bootstrap ok');
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
//# sourceMappingURL=remote-db-bootstrap.js.map