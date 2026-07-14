/**
 * 为 applyBlogCategoryTags 标注 x-contextIdCatalog，
 * 使 PageAction context.categories[].id 成为 string[] 白名单。
 *
 * 用法：npx ts-node -r tsconfig-paths/register prisma/scripts/patch-apply-blog-category-tags-catalog.ts
 */
import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Prisma } from '../../generated/prisma/client';
import { PrismaClient } from '../../generated/prisma/client';

const TOOL_NAME = 'applyBlogCategoryTags';
const CATALOG_PATH = 'categories';
const FIELD_KEYS = [
  'primaryCategoryTagIds',
  'associatedCategoryTagIds',
] as const;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function patchArgsSchema(argsSchema: unknown): Record<string, unknown> | null {
  if (!isRecord(argsSchema) || !isRecord(argsSchema.properties)) {
    return null;
  }
  const properties = {
    ...(argsSchema.properties as Record<string, unknown>),
  };
  let changed = false;
  for (const key of FIELD_KEYS) {
    const def = properties[key];
    if (!isRecord(def)) {
      continue;
    }
    if (def['x-contextIdCatalog'] === CATALOG_PATH) {
      continue;
    }
    properties[key] = {
      ...def,
      'x-contextIdCatalog': CATALOG_PATH,
    };
    changed = true;
  }
  if (!changed) {
    return null;
  }
  return {
    ...argsSchema,
    properties,
  };
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
    console.log(
      `skip HostTool id=${tool.id}: x-contextIdCatalog already set or properties missing`,
    );
    return;
  }
  await prisma.hostTool.update({
    where: { id: tool.id },
    data: { argsSchema: next as Prisma.InputJsonValue },
  });
  console.log(
    `patched HostTool id=${tool.id} name=${tool.name}: ` +
      `x-contextIdCatalog="${CATALOG_PATH}" on ${FIELD_KEYS.join(', ')}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
