"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../env/load-env");
const pg_1 = require("pg");
const ioredis_1 = require("ioredis");
const CONNECT_TIMEOUT_MS = 10000;
function maskDatabaseUrl(url) {
    try {
        const parsed = new URL(url);
        const user = parsed.username || '(none)';
        const host = parsed.hostname;
        const port = parsed.port || '5432';
        const db = parsed.pathname.replace(/^\//, '') || '(none)';
        return `${user}@${host}:${port}/${db}`;
    }
    catch (_a) {
        return '(invalid DATABASE_URL)';
    }
}
function createRedisClient() {
    var _a, _b, _c, _d;
    const url = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
    const host = (_b = process.env.REDIS_HOST) === null || _b === void 0 ? void 0 : _b.trim();
    const password = ((_c = process.env.REDIS_PASSWORD) === null || _c === void 0 ? void 0 : _c.trim()) || undefined;
    const options = {
        password,
        connectTimeout: CONNECT_TIMEOUT_MS,
        maxRetriesPerRequest: 1,
        db: process.env.REDIS_DB
            ? Number.parseInt(process.env.REDIS_DB, 10)
            : undefined,
    };
    if (url) {
        return new ioredis_1.default(url, options);
    }
    if (host) {
        return new ioredis_1.default(Object.assign({ host, port: Number.parseInt((_d = process.env.REDIS_PORT) !== null && _d !== void 0 ? _d : '6379', 10) }, options));
    }
    throw new Error('Set REDIS_URL or REDIS_HOST');
}
async function smokePostgres() {
    var _a, _b, _c;
    const connectionString = (_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }
    const client = new pg_1.Client({
        connectionString,
        connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    });
    const started = Date.now();
    try {
        await client.connect();
        const result = await client.query('SELECT current_database() AS db, current_user AS usr');
        const row = result.rows[0];
        console.log(`postgres ok (${Date.now() - started}ms) target=${maskDatabaseUrl(connectionString)} db=${(_b = row === null || row === void 0 ? void 0 : row.db) !== null && _b !== void 0 ? _b : '?'} user=${(_c = row === null || row === void 0 ? void 0 : row.usr) !== null && _c !== void 0 ? _c : '?'}`);
    }
    finally {
        await client.end().catch(() => undefined);
    }
}
async function smokeRedis() {
    var _a, _b, _c;
    const redis = createRedisClient();
    const started = Date.now();
    try {
        const pong = await redis.ping();
        if (pong !== 'PONG') {
            throw new Error(`unexpected ping response: ${pong}`);
        }
        const target = ((_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim()) ||
            `${process.env.REDIS_HOST}:${(_b = process.env.REDIS_PORT) !== null && _b !== void 0 ? _b : '6379'}`;
        console.log(`redis ok (${Date.now() - started}ms) target=${target} db=${(_c = process.env.REDIS_DB) !== null && _c !== void 0 ? _c : '0'}`);
    }
    finally {
        await redis.quit().catch(() => undefined);
    }
}
async function main() {
    let failed = false;
    try {
        await smokePostgres();
    }
    catch (error) {
        failed = true;
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`postgres fail: ${reason}`);
    }
    try {
        await smokeRedis();
    }
    catch (error) {
        failed = true;
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`redis fail: ${reason}`);
    }
    if (failed) {
        process.exit(1);
    }
    console.log('db smoke ok');
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
//# sourceMappingURL=db-smoke.js.map