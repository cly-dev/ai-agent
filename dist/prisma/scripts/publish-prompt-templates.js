"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const ioredis_1 = require("ioredis");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const ensure_global_prompt_templates_1 = require("../../src/core/prompt/ensure-global-prompt-templates");
const prompt_defaults_1 = require("../../src/core/prompt/prompt-defaults");
const prompt_template_keys_1 = require("../../src/core/prompt/prompt-template.keys");
const prompt_template_keys_2 = require("../../src/core/prompt/redis/prompt-template-keys");
const DEFAULT_LOCALE = 'zh-CN';
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString })),
});
function parseKeys(argv) {
    const allowed = new Set(prompt_template_keys_1.PROMPT_KEY_LIST);
    const keys = [];
    for (const raw of argv) {
        if (raw === '--all-outdated') {
            continue;
        }
        if (!allowed.has(raw)) {
            throw new Error(`unknown prompt key: ${raw}`);
        }
        keys.push(raw);
    }
    return keys;
}
async function resolvePublishKeys(argv) {
    if (argv.includes('--all-outdated')) {
        const outdated = [];
        for (const key of prompt_template_keys_1.PROMPT_KEY_LIST) {
            const active = await prisma.promptTemplate.findFirst({
                where: {
                    key,
                    appClientId: null,
                    agentId: null,
                    locale: DEFAULT_LOCALE,
                    isActive: true,
                },
                select: { content: true },
            });
            if (!active || active.content !== prompt_defaults_1.PROMPT_DEFAULT_CONTENT[key]) {
                outdated.push(key);
            }
        }
        return outdated;
    }
    const explicit = parseKeys(argv);
    return explicit.length > 0 ? explicit : ensure_global_prompt_templates_1.DEFAULT_RUNTIME_PROMPT_PUBLISH_KEYS;
}
async function syncPublishedRowsToRedis(templateIds) {
    var _a;
    const redisUrl = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (!redisUrl || templateIds.length === 0) {
        return;
    }
    const rows = await prisma.promptTemplate.findMany({
        where: { id: { in: templateIds } },
    });
    const redis = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
    try {
        await redis.connect();
        for (const row of rows) {
            const redisKey = (0, prompt_template_keys_2.promptTemplateActiveKey)(row.key, row.appClientId, row.agentId, row.locale);
            await redis.set(redisKey, JSON.stringify((0, ensure_global_prompt_templates_1.toResolvedGlobalPrompt)(row)));
            console.log(`redis synced: ${redisKey}`);
        }
    }
    finally {
        redis.disconnect();
    }
}
async function main() {
    const keys = await resolvePublishKeys(process.argv.slice(2));
    if (keys.length === 0) {
        console.log('no prompt keys to publish');
        return;
    }
    console.log(`publishing ${keys.length} key(s): ${keys.join(', ')}`);
    const result = await (0, ensure_global_prompt_templates_1.publishGlobalPromptsFromDefaults)(prisma, {
        keys,
        locale: DEFAULT_LOCALE,
        onlyIfOutdated: true,
    });
    for (const row of result.published) {
        console.log(`published ${row.key} v${row.version} (templateId=${row.templateId})`);
    }
    for (const key of result.unchanged) {
        console.log(`unchanged (already matches defaults): ${key}`);
    }
    for (const key of result.missing) {
        console.log(`missing default content: ${key}`);
    }
    await syncPublishedRowsToRedis(result.published.map((row) => row.templateId));
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=publish-prompt-templates.js.map