import '../../src/core/env/load-env';
import { isExcludedToolPath } from '../../src/codegen/tool-path-filter.util';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

async function deleteOrphanToolCategories(): Promise<number> {
  const orphans = await prisma.toolCategory.findMany({
    where: { tools: { none: {} } },
    select: { id: true, label: true },
    orderBy: { id: 'asc' },
  });
  if (orphans.length === 0) {
    return 0;
  }
  for (const row of orphans.slice(0, 5)) {
    // eslint-disable-next-line no-console
    console.log(`  category #${row.id} ${row.label}`);
  }
  if (orphans.length > 5) {
    // eslint-disable-next-line no-console
    console.log(`  ... and ${orphans.length - 5} more`);
  }
  const deleted = await prisma.toolCategory.deleteMany({
    where: { id: { in: orphans.map((row) => row.id) } },
  });
  return deleted.count;
}

async function main(): Promise<void> {
  const allTools = await prisma.tool.findMany({
    select: { id: true, path: true, name: true },
  });
  const tools = allTools.filter((t) => isExcludedToolPath(t.path));

  if (tools.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No tools matched path containing public or buyer.');
    const categoryCount = await deleteOrphanToolCategories();
    // eslint-disable-next-line no-console
    console.log(`Deleted orphan ToolCategory=${categoryCount}`);
    return;
  }

  const toolIds = tools.map((t) => t.id);
  // eslint-disable-next-line no-console
  console.log(`Matched ${toolIds.length} tools. Sample paths:`);
  for (const t of tools.slice(0, 5)) {
    // eslint-disable-next-line no-console
    console.log(`  #${t.id} ${t.path} (${t.name})`);
  }
  if (tools.length > 5) {
    // eslint-disable-next-line no-console
    console.log(`  ... and ${tools.length - 5} more`);
  }

  const [skillTool, agentTool, roleTool, deletedTools] =
    await prisma.$transaction([
      prisma.skillTool.deleteMany({ where: { toolId: { in: toolIds } } }),
      prisma.agentTool.deleteMany({ where: { toolId: { in: toolIds } } }),
      prisma.roleTool.deleteMany({ where: { toolId: { in: toolIds } } }),
      prisma.tool.deleteMany({ where: { id: { in: toolIds } } }),
    ]);

  // eslint-disable-next-line no-console
  console.log(
    `Deleted: Tool=${deletedTools.count}, SkillTool=${skillTool.count}, AgentTool=${agentTool.count}, RoleTool=${roleTool.count}`,
  );

  const categoryCount = await deleteOrphanToolCategories();
  // eslint-disable-next-line no-console
  console.log(`Deleted orphan ToolCategory=${categoryCount}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
