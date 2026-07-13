"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const ioredis_1 = require("ioredis");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const prompt_template_keys_1 = require("../../src/core/prompt/prompt-template.keys");
const prompt_template_keys_2 = require("../../src/core/prompt/redis/prompt-template-keys");
const ALLOWED_KEYS = new Set(prompt_template_keys_1.PROMPT_KEY_LIST);
const OBSOLETE_KEY_FRAGMENTS = [
    'precheck',
    'working_memory_refresh',
];
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString })),
});
function isObsoletePromptKey(key) {
    if (!ALLOWED_KEYS.has(key)) {
        return true;
    }
    return OBSOLETE_KEY_FRAGMENTS.some((fragment) => key.includes(fragment));
}
async function clearRedisPromptCache(rows) {
    var _a;
    const redisUrl = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (!redisUrl || rows.length === 0) {
        return 0;
    }
    const redis = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
    let cleared = 0;
    try {
        await redis.connect();
        const seen = new Set();
        for (const row of rows) {
            const redisKey = (0, prompt_template_keys_2.promptTemplateActiveKey)(row.key, row.appClientId, row.agentId, row.locale);
            if (seen.has(redisKey)) {
                continue;
            }
            seen.add(redisKey);
            const deleted = await redis.del(redisKey);
            if (deleted > 0) {
                cleared += deleted;
                console.log(`redis del: ${redisKey}`);
            }
        }
    }
    finally {
        redis.disconnect();
    }
    return cleared;
}
async function main() {
    const allRows = await prisma.promptTemplate.findMany({
        select: {
            id: true,
            key: true,
            version: true,
            locale: true,
            appClientId: true,
            agentId: true,
            isActive: true,
        },
        orderBy: [{ key: 'asc' }, { version: 'asc' }],
    });
    const obsolete = allRows.filter((row) => isObsoletePromptKey(row.key));
    if (obsolete.length === 0) {
        console.log('no obsolete prompt templates found');
        console.log(`allowed keys (${ALLOWED_KEYS.size}): ${[...ALLOWED_KEYS].join(', ')}`);
        return;
    }
    for (const row of obsolete) {
        console.log(`will delete #${row.id} key=${row.key} v${row.version} active=${row.isActive}`);
    }
    const redisCleared = await clearRedisPromptCache(obsolete);
    const deleted = await prisma.promptTemplate.deleteMany({
        where: { id: { in: obsolete.map((row) => row.id) } },
    });
    console.log(`deleted PromptTemplate rows=${deleted.count}, redis keys cleared=${redisCleared}`);
    console.log(`remaining allowed keys (${ALLOWED_KEYS.size}): ${[...ALLOWED_KEYS].join(', ')}`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=delete-obsolete-prompt-templates.js.map