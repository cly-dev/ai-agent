"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const tool_path_filter_util_1 = require("../../src/codegen/tool-path-filter.util");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
async function deleteOrphanToolCategories() {
    const orphans = await prisma.toolCategory.findMany({
        where: { tools: { none: {} } },
        select: { id: true, label: true },
        orderBy: { id: 'asc' },
    });
    if (orphans.length === 0) {
        return 0;
    }
    for (const row of orphans.slice(0, 5)) {
        console.log(`  category #${row.id} ${row.label}`);
    }
    if (orphans.length > 5) {
        console.log(`  ... and ${orphans.length - 5} more`);
    }
    const deleted = await prisma.toolCategory.deleteMany({
        where: { id: { in: orphans.map((row) => row.id) } },
    });
    return deleted.count;
}
async function main() {
    const allTools = await prisma.tool.findMany({
        select: { id: true, path: true, name: true },
    });
    const tools = allTools.filter((t) => (0, tool_path_filter_util_1.isExcludedToolPath)(t.path));
    if (tools.length === 0) {
        console.log('No tools matched path containing public or buyer.');
        const categoryCount = await deleteOrphanToolCategories();
        console.log(`Deleted orphan ToolCategory=${categoryCount}`);
        return;
    }
    const toolIds = tools.map((t) => t.id);
    console.log(`Matched ${toolIds.length} tools. Sample paths:`);
    for (const t of tools.slice(0, 5)) {
        console.log(`  #${t.id} ${t.path} (${t.name})`);
    }
    if (tools.length > 5) {
        console.log(`  ... and ${tools.length - 5} more`);
    }
    const [skillTool, agentTool, roleTool, deletedTools] = await prisma.$transaction([
        prisma.skillTool.deleteMany({ where: { toolId: { in: toolIds } } }),
        prisma.agentTool.deleteMany({ where: { toolId: { in: toolIds } } }),
        prisma.roleTool.deleteMany({ where: { toolId: { in: toolIds } } }),
        prisma.tool.deleteMany({ where: { id: { in: toolIds } } }),
    ]);
    console.log(`Deleted: Tool=${deletedTools.count}, SkillTool=${skillTool.count}, AgentTool=${agentTool.count}, RoleTool=${roleTool.count}`);
    const categoryCount = await deleteOrphanToolCategories();
    console.log(`Deleted orphan ToolCategory=${categoryCount}`);
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=delete-public-buyer-tools.js.map