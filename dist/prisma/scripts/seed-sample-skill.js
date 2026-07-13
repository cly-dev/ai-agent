"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../../src/core/env/load-env");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const client_1 = require("../../generated/prisma/client");
const skill_risk_util_1 = require("../../src/modules/skill/util/skill-risk.util");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}
const adapter = new adapter_pg_1.PrismaPg(new pg_1.Pool({ connectionString }));
const prisma = new client_1.PrismaClient({ adapter });
const SKILL_NAME = '订单查询';
const SKILL_CAPABILITY_KEY = 'order.inquiry';
const SAMPLE_PROMPT = `你是订单查询助手。按以下步骤处理用户请求：

1. 若用户未提供订单号，先礼貌询问订单号或手机号等可查标识。
2. 优先使用列表类工具缩小范围，再按需调用详情类工具。
3. 只使用本 Skill 已绑定的工具；不要编造订单状态。
4. 回复用简洁中文，列出关键字段（订单号、状态、金额、时间）。`;
function parseAgentId() {
    var _a;
    const raw = (_a = process.env.SEED_SKILL_AGENT_ID) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return null;
    }
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}
function parseAppClientId() {
    var _a, _b;
    const raw = (_b = (_a = process.env.SEED_SKILL_APP_CLIENT_ID) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '2';
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('SEED_SKILL_APP_CLIENT_ID must be a positive integer');
    }
    return id;
}
async function resolveAgent(appClientId) {
    const explicitAgentId = parseAgentId();
    if (explicitAgentId != null) {
        const agent = await prisma.agent.findFirst({
            where: { id: explicitAgentId, appClientId },
            select: { id: true, appClientId: true, name: true },
        });
        if (!agent) {
            throw new Error(`agent id=${explicitAgentId} not found under appClientId=${appClientId}`);
        }
        return agent;
    }
    const preferred = await prisma.agent.findFirst({
        where: { appClientId, name: '运营助手' },
        select: { id: true, appClientId: true, name: true },
    });
    if (preferred) {
        return preferred;
    }
    const anyAgent = await prisma.agent.findFirst({
        where: { appClientId },
        orderBy: { id: 'asc' },
        select: { id: true, appClientId: true, name: true },
    });
    if (!anyAgent) {
        throw new Error(`no agent under appClientId=${appClientId}; run prisma/scripts/seed-ops-agent.ts first`);
    }
    return anyAgent;
}
async function pickAgentToolIds(agentId, maxTools) {
    const bindings = await prisma.agentTool.findMany({
        where: { agentId },
        orderBy: { toolId: 'asc' },
        take: maxTools,
        select: { toolId: true },
    });
    return bindings.map((row) => row.toolId);
}
async function main() {
    const appClientId = parseAppClientId();
    const agent = await resolveAgent(appClientId);
    const existing = await prisma.skill.findFirst({
        where: { appClientId: agent.appClientId, name: SKILL_NAME },
        include: {
            skillTools: { select: { toolId: true, isRequired: true } },
        },
    });
    if (existing) {
        console.log(JSON.stringify({
            status: 'exists',
            skillId: existing.id,
            agentId: agent.id,
            appClientId: agent.appClientId,
            agentName: agent.name,
            name: existing.name,
            capabilityKey: existing.capabilityKey,
            toolBindings: existing.skillTools,
        }, null, 2));
        return;
    }
    const toolIds = await pickAgentToolIds(agent.id, 3);
    const toolRiskLevels = toolIds.length > 0
        ? (await prisma.tool.findMany({
            where: { id: { in: toolIds } },
            select: { riskLevel: true },
        })).map((row) => row.riskLevel)
        : [];
    const riskLevel = (0, skill_risk_util_1.resolveSkillRiskLevel)({ toolRiskLevels });
    const skill = await prisma.skill.create({
        data: {
            appClientId: agent.appClientId,
            name: SKILL_NAME,
            capabilityKey: SKILL_CAPABILITY_KEY,
            description: '根据订单号或条件查询订单信息',
            prompt: SAMPLE_PROMPT,
            riskLevel,
            isActive: true,
            agentSkills: {
                create: [{ agentId: agent.id }],
            },
            skillTools: toolIds.length > 0
                ? {
                    create: toolIds.map((toolId, index) => ({
                        toolId,
                        isRequired: index === 0,
                    })),
                }
                : undefined,
        },
        include: {
            skillTools: { select: { toolId: true, isRequired: true } },
        },
    });
    console.log(JSON.stringify({
        status: 'created',
        skillId: skill.id,
        agentId: agent.id,
        appClientId: agent.appClientId,
        agentName: agent.name,
        name: skill.name,
        capabilityKey: skill.capabilityKey,
        toolBindings: skill.skillTools,
        hint: toolIds.length === 0
            ? 'Agent 尚无可用 Tool，请先在 App 注册工具后 PUT .../skills/:id/tools'
            : undefined,
    }, null, 2));
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
//# sourceMappingURL=seed-sample-skill.js.map