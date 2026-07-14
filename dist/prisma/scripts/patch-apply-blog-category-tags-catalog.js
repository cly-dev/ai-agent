"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const TOOL_NAME = 'applyBlogCategoryTags';
const CATALOG_PATH = 'categories';
const FIELD_KEYS = [
    'primaryCategoryTagIds',
    'associatedCategoryTagIds',
];
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function patchArgsSchema(argsSchema) {
    if (!isRecord(argsSchema) || !isRecord(argsSchema.properties)) {
        return null;
    }
    const properties = Object.assign({}, argsSchema.properties);
    let changed = false;
    for (const key of FIELD_KEYS) {
        const def = properties[key];
        if (!isRecord(def)) {
            continue;
        }
        if (def['x-contextIdCatalog'] === CATALOG_PATH) {
            continue;
        }
        properties[key] = Object.assign(Object.assign({}, def), { 'x-contextIdCatalog': CATALOG_PATH });
        changed = true;
    }
    if (!changed) {
        return null;
    }
    return Object.assign(Object.assign({}, argsSchema), { properties });
}
async function main() {
    const tool = await prisma.hostTool.findFirst({
        where: { name: TOOL_NAME },
        select: { id: true, name: true, argsSchema: true },
    });
    if (!tool) {
        throw new Error(`HostTool "${TOOL_NAME}" not found`);
    }
    const next = patchArgsSchema(tool.argsSchema);
    if (!next) {
        console.log(`skip HostTool id=${tool.id}: x-contextIdCatalog already set or properties missing`);
        return;
    }
    await prisma.hostTool.update({
        where: { id: tool.id },
        data: { argsSchema: next },
    });
    console.log(`patched HostTool id=${tool.id} name=${tool.name}: ` +
        `x-contextIdCatalog="${CATALOG_PATH}" on ${FIELD_KEYS.join(', ')}`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=patch-apply-blog-category-tags-catalog.js.map