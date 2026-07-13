"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAgentSkillVisibilityContext = exports.loadAgentHostToolCandidateIds = exports.loadAgentToolCandidateIds = void 0;
const capability_candidate_util_1 = require("./capability-candidate.util");
async function loadAgentToolCandidateIds(prisma, appClientId, agentId) {
    const agent = await prisma.agent.findFirst({
        where: { id: agentId, appClientId },
        select: { restrictTools: true },
    });
    if (!agent) {
        return [];
    }
    const [bindings, appActive] = await Promise.all([
        prisma.agentTool.findMany({
            where: { agentId },
            select: { toolId: true },
            orderBy: { toolId: 'asc' },
        }),
        prisma.tool.findMany({
            where: { appClientId, isActive: true },
            select: { id: true },
            orderBy: { id: 'asc' },
        }),
    ]);
    return (0, capability_candidate_util_1.resolveAgentToolCandidateIds)({
        restrictTools: agent.restrictTools,
        whitelistIds: bindings.map((row) => row.toolId),
        appActiveIds: appActive.map((row) => row.id),
    });
}
exports.loadAgentToolCandidateIds = loadAgentToolCandidateIds;
async function loadAgentHostToolCandidateIds(prisma, appClientId, agentId) {
    const agent = await prisma.agent.findFirst({
        where: { id: agentId, appClientId },
        select: { restrictHostTools: true },
    });
    if (!agent) {
        return [];
    }
    const [bindings, appActive] = await Promise.all([
        prisma.agentHostTool.findMany({
            where: { agentId },
            select: { hostToolId: true },
            orderBy: { hostToolId: 'asc' },
        }),
        prisma.hostTool.findMany({
            where: { appClientId, isActive: true },
            select: { id: true },
            orderBy: { id: 'asc' },
        }),
    ]);
    return (0, capability_candidate_util_1.resolveAgentHostToolCandidateIds)({
        restrictHostTools: agent.restrictHostTools,
        whitelistIds: bindings.map((row) => row.hostToolId),
        appActiveIds: appActive.map((row) => row.id),
    });
}
exports.loadAgentHostToolCandidateIds = loadAgentHostToolCandidateIds;
async function loadAgentSkillVisibilityContext(prisma, appClientId, agentId) {
    const agent = await prisma.agent.findFirst({
        where: { id: agentId, appClientId },
        select: { restrictSkills: true },
    });
    if (!agent) {
        return { restrictSkills: true, skillWhitelistIds: [] };
    }
    const bindings = await prisma.agentSkill.findMany({
        where: { agentId },
        select: { skillId: true },
        orderBy: { skillId: 'asc' },
    });
    return {
        restrictSkills: agent.restrictSkills,
        skillWhitelistIds: bindings.map((row) => row.skillId),
    };
}
exports.loadAgentSkillVisibilityContext = loadAgentSkillVisibilityContext;
//# sourceMappingURL=agent-capability-load.util.js.map