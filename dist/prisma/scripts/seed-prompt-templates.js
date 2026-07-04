"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const ensure_global_prompt_templates_1 = require("../../src/core/prompt/ensure-global-prompt-templates");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString })),
});
async function main() {
    const { created, skipped } = await (0, ensure_global_prompt_templates_1.ensureGlobalPromptTemplates)(prisma);
    for (const key of created) {
        console.log(`created global prompt: ${key}`);
    }
    for (const key of skipped) {
        console.log(`skipped (already active): ${key}`);
    }
    if (created.length === 0) {
        console.log('all prompt keys already present in DB');
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed-prompt-templates.js.map