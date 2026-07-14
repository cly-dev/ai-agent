"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
function parseDefaultToolIds() {
    var _a;
    const raw = (_a = process.env.OPS_AGENT_TOOL_IDS) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return [];
    }
    return raw
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0);
}
async function main() {
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
        console.log(`agent "运营助手" already exists with id=${existing.id} for appClientId=${appClientId}`);
        return;
    }
    const agent = await prisma.agent.create({
        data: {
            appClientId,
            name: '运营助手',
            description: '帮助运营同学处理日常运营相关问题的助手',
            systemPrompt: '你是一名运营助手，擅长分析活动效果、用户行为和文案优化，用简洁中文回答用户问题。',
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
    console.log(`created ops agent with id=${agent.id} for appClientId=${appClientId}, linked tools=${defaultToolIds.length}`);
}
main()
    .finally(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    await prisma.$disconnect();
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=seed-ops-agent.js.map