import '../../src/core/env/load-env';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

function parseDefaultToolIds(): number[] {
  const raw = process.env.OPS_AGENT_TOOL_IDS?.trim();
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

async function main(): Promise<void> {
  const appClientId = 2;
  const defaultToolIds = parseDefaultToolIds();

  const appClient = await prisma.appClient.findUnique({
    where: { id: appClientId },
  });
  if (!appClient) {
    throw new Error(`appClient with id=${appClientId} not found`);
  }

  const existing = await prisma.agent.findFirst({
    where: { appClientId, name: '运营助手' },
  });
  if (existing) {
    // 已存在则直接返回
    // eslint-disable-next-line no-console
    console.log(
      `agent "运营助手" already exists with id=${existing.id} for appClientId=${appClientId}`,
    );
    return;
  }

  const agent = await prisma.agent.create({
    data: {
      appClientId,
      name: '运营助手',
      description: '帮助运营同学处理日常运营相关问题的助手',
      systemPrompt:
        '你是一名运营助手，擅长分析活动效果、用户行为和文案优化，用简洁中文回答用户问题。',
      maxSteps: 8,
      enableToolCall: true,
      config: {},
    },
  });

  if (defaultToolIds.length > 0) {
    await prisma.agentTool.createMany({
      data: defaultToolIds.map((toolId) => ({
        agentId: agent.id,
        toolId,
      })),
      skipDuplicates: true,
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `created ops agent with id=${agent.id} for appClientId=${appClientId}, linked tools=${defaultToolIds.length}`,
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

