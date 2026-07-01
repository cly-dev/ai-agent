"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../env/load-env");
const ioredis_1 = require("ioredis");
const redis_keys_1 = require("./redis-keys");
function createClient() {
    var _a, _b, _c, _d;
    const url = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
    const host = (_b = process.env.REDIS_HOST) === null || _b === void 0 ? void 0 : _b.trim();
    const password = ((_c = process.env.REDIS_PASSWORD) === null || _c === void 0 ? void 0 : _c.trim()) || undefined;
    if (url) {
        return new ioredis_1.default(url, { password });
    }
    if (host) {
        return new ioredis_1.default({
            host,
            port: Number.parseInt((_d = process.env.REDIS_PORT) !== null && _d !== void 0 ? _d : '6379', 10),
            password,
            db: process.env.REDIS_DB
                ? Number.parseInt(process.env.REDIS_DB, 10)
                : undefined,
        });
    }
    throw new Error('Set REDIS_URL or REDIS_HOST');
}
async function main() {
    const redis = createClient();
    try {
        await redis.ping();
        const uid = 999001;
        const sid = 'a'.repeat(32);
        const uk = (0, redis_keys_1.userMemoryKey)(uid);
        const sk = (0, redis_keys_1.sessionContextKey)(sid);
        await redis.set(uk, JSON.stringify({ test: 'user-memory', v: 1 }), 'EX', 60);
        const gv = await redis.get(uk);
        if (!gv || !gv.includes('user-memory')) {
            throw new Error('user memory roundtrip failed');
        }
        await redis.set(sk, JSON.stringify({ turns: [] }), 'EX', 2);
        await redis.expire(sk, 10);
        const ttl = await redis.ttl(sk);
        if (ttl <= 0) {
            throw new Error('expected positive TTL');
        }
        await redis.del(uk, sk);
        console.log('redis smoke ok');
    }
    finally {
        await redis.quit();
    }
}
main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
//# sourceMappingURL=redis-smoke.js.map