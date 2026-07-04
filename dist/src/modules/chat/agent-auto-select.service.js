"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAutoSelectService = void 0;
const common_1 = require("@nestjs/common");
const page_context_anchor_util_1 = require("../../core/host-bridge/page-context-anchor.util");
const capability_candidate_util_1 = require("../../core/runtime-cache/capability-candidate.util");
const agent_client_access_util_1 = require("../agent/util/agent-client-access.util");
function groupByAgentId(rows) {
    const grouped = new Map();
    for (const row of rows) {
        const bucket = grouped.get(row.agentId);
        if (bucket) {
            bucket.push(row);
        }
        else {
            grouped.set(row.agentId, [row]);
        }
    }
    return grouped;
}
const AUTO_AGENT_MIN_SCORE = 20;
const AUTO_AGENT_CLEAR_WIN_MARGIN = 10;
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function isConfiguredDefault(config) {
    if (!isRecord(config)) {
        return false;
    }
    const autoAgent = config.autoAgent;
    return (config.isDefault === true ||
        config.default === true ||
        config.autoAgentDefault === true ||
        (isRecord(autoAgent) && autoAgent.default === true));
}
function collectText(value, out) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
            out.push(trimmed);
        }
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value.slice(0, 20)) {
            collectText(item, out);
        }
        return;
    }
    if (isRecord(value)) {
        for (const item of Object.values(value).slice(0, 40)) {
            collectText(item, out);
        }
    }
}
function normalizeSearchText(value) {
    return value.toLowerCase().replace(/\s+/g, ' ').trim();
}
function textSimilarityScore(input) {
    const query = normalizeSearchText(input.query);
    const target = normalizeSearchText(input.target);
    if (!query || !target) {
        return 0;
    }
    if (target.includes(query) || query.includes(target)) {
        return input.maxScore;
    }
    const queryParts = query
        .split(/[\s,.;:!?()[\]{}"'`/\\|_-]+/)
        .map((part) => part.trim())
        .filter((part) => part.length >= 2);
    if (queryParts.length === 0) {
        return 0;
    }
    const matched = queryParts.filter((part) => target.includes(part)).length;
    return Math.round((matched / queryParts.length) * input.maxScore);
}
class AgentAutoSelectService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AgentAutoSelectService.name);
    }
    async select(input) {
        const candidates = await this.loadCandidates(input);
        if (input.requestedAgentId != null) {
            const requested = candidates.find((candidate) => candidate.id === input.requestedAgentId);
            if (!requested) {
                await this.assertAgentBelongsToApp(input.requestedAgentId, input.appClientId);
                throw new common_1.BadRequestException({
                    code: 'AGENT_NOT_AVAILABLE',
                    message: `agent ${input.requestedAgentId} is not available for current user`,
                });
            }
            return {
                agentId: input.requestedAgentId,
                source: 'requested',
                reason: 'requested agentId',
            };
        }
        if (input.sessionAgentId != null) {
            const sessionCandidate = candidates.find((candidate) => candidate.id === input.sessionAgentId);
            if (sessionCandidate) {
                return {
                    agentId: input.sessionAgentId,
                    source: 'session',
                    reason: 'session bound agentId',
                };
            }
            this.logger.warn(`session bound agent unavailable; reselecting appClientId=${input.appClientId} userId=${input.userId} sessionAgentId=${input.sessionAgentId}`);
        }
        if (candidates.length === 0) {
            throw new common_1.BadRequestException({
                code: 'NO_AVAILABLE_AGENT',
                message: '当前应用未配置当前用户可用的 Agent，请联系管理员配置 Agent。',
            });
        }
        const scored = this.scoreCandidates(candidates, input);
        const [best, second] = scored;
        const configuredDefault = scored.find((row) => row.isConfiguredDefault);
        const selected = best &&
            best.score >= AUTO_AGENT_MIN_SCORE &&
            (!second || best.score - second.score >= AUTO_AGENT_CLEAR_WIN_MARGIN)
            ? {
                agentId: best.id,
                source: 'auto',
                confidence: Math.min(1, best.score / 100),
                reason: best.reasons.join('; ') || 'highest auto-agent score',
            }
            : configuredDefault
                ? {
                    agentId: configuredDefault.id,
                    source: 'default',
                    confidence: Math.min(1, configuredDefault.score / 100),
                    reason: 'configured default agent',
                }
                : {
                    agentId: scored[0].id,
                    source: 'fallback',
                    confidence: Math.min(1, scored[0].score / 100),
                    reason: 'first available agent fallback',
                };
        this.logger.debug(`auto agent selected appClientId=${input.appClientId} userId=${input.userId} agentId=${selected.agentId} source=${selected.source} reason="${selected.reason}" candidates=${scored.length}`);
        return selected;
    }
    async loadCandidates(input) {
        var _a, _b, _c, _d, _e, _f;
        await this.assertAppClientExists(input.appClientId);
        const roleCtx = await this.resolveUserRoleToolContext(input.userId, input.appClientId);
        if (!roleCtx) {
            return [];
        }
        const [accessibleTools, roleHostToolRows, agents, appActiveTools, appActiveHostTools, appActiveSkills,] = await Promise.all([
            this.prisma.tool.findMany({
                where: (0, agent_client_access_util_1.buildRoleAccessibleToolWhere)(input.appClientId, roleCtx, {}),
                select: { id: true },
            }),
            this.prisma.roleHostTool.findMany({
                where: {
                    roleId: roleCtx.roleId,
                    hostTool: { appClientId: input.appClientId, isActive: true },
                },
                select: { hostToolId: true },
            }),
            this.prisma.agent.findMany({
                where: { appClientId: input.appClientId },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    config: true,
                    restrictTools: true,
                    restrictHostTools: true,
                    restrictSkills: true,
                },
            }),
            this.prisma.tool.findMany({
                where: { appClientId: input.appClientId, isActive: true },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    definitionKey: true,
                    agentMetadata: true,
                },
            }),
            this.prisma.hostTool.findMany({
                where: { appClientId: input.appClientId, isActive: true },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    definitionKey: true,
                    hostPage: { select: { scope: true } },
                },
            }),
            this.prisma.skill.findMany({
                where: { appClientId: input.appClientId, isActive: true },
                orderBy: { id: 'asc' },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    capabilityKey: true,
                },
            }),
        ]);
        if (agents.length === 0) {
            return [];
        }
        const agentIds = agents.map((agent) => agent.id);
        const [agentToolBindings, agentHostToolBindings, agentSkillBindings] = await Promise.all([
            this.prisma.agentTool.findMany({
                where: { agentId: { in: agentIds } },
                select: { agentId: true, toolId: true },
                orderBy: { toolId: 'asc' },
            }),
            this.prisma.agentHostTool.findMany({
                where: { agentId: { in: agentIds } },
                select: { agentId: true, hostToolId: true },
                orderBy: { hostToolId: 'asc' },
            }),
            this.prisma.agentSkill.findMany({
                where: { agentId: { in: agentIds } },
                select: { agentId: true, skillId: true },
                orderBy: { skillId: 'asc' },
            }),
        ]);
        const accessibleToolIds = new Set(accessibleTools.map((tool) => tool.id));
        const roleHostToolIds = new Set(roleHostToolRows.map((row) => row.hostToolId));
        const appActiveToolIds = appActiveTools.map((tool) => tool.id);
        const appActiveHostToolIds = appActiveHostTools.map((tool) => tool.id);
        const appActiveSkillById = new Map(appActiveSkills.map((skill) => [skill.id, skill]));
        const toolById = new Map(appActiveTools.map((tool) => [tool.id, tool]));
        const hostToolById = new Map(appActiveHostTools.map((hostTool) => [hostTool.id, hostTool]));
        const agentToolsByAgent = groupByAgentId(agentToolBindings);
        const agentHostToolsByAgent = groupByAgentId(agentHostToolBindings);
        const agentSkillsByAgent = groupByAgentId(agentSkillBindings);
        const agentRows = agents;
        const candidates = [];
        for (const agent of agentRows) {
            const toolWhitelistIds = (_b = (_a = agentToolsByAgent.get(agent.id)) === null || _a === void 0 ? void 0 : _a.map((row) => row.toolId)) !== null && _b !== void 0 ? _b : [];
            const hostToolWhitelistIds = (_d = (_c = agentHostToolsByAgent.get(agent.id)) === null || _c === void 0 ? void 0 : _c.map((row) => row.hostToolId)) !== null && _d !== void 0 ? _d : [];
            const skillWhitelistIds = (_f = (_e = agentSkillsByAgent.get(agent.id)) === null || _e === void 0 ? void 0 : _e.map((row) => row.skillId)) !== null && _f !== void 0 ? _f : [];
            const toolCandidateIds = (0, capability_candidate_util_1.resolveAgentToolCandidateIds)({
                restrictTools: agent.restrictTools,
                whitelistIds: toolWhitelistIds,
                appActiveIds: appActiveToolIds,
            });
            const hostToolCandidateIds = (0, capability_candidate_util_1.resolveAgentHostToolCandidateIds)({
                restrictHostTools: agent.restrictHostTools,
                whitelistIds: hostToolWhitelistIds,
                appActiveIds: appActiveHostToolIds,
            });
            const allowedToolIds = toolCandidateIds.filter((toolId) => accessibleToolIds.has(toolId));
            const allowedHostToolIds = roleHostToolIds.size === 0
                ? []
                : hostToolCandidateIds.filter((hostToolId) => roleHostToolIds.has(hostToolId));
            if (allowedToolIds.length === 0 && allowedHostToolIds.length === 0) {
                continue;
            }
            const tools = allowedToolIds
                .map((toolId) => toolById.get(toolId))
                .filter((tool) => tool != null);
            const hostTools = allowedHostToolIds
                .map((hostToolId) => hostToolById.get(hostToolId))
                .filter((hostTool) => hostTool != null);
            const skillVisibilityTightened = (0, capability_candidate_util_1.resolveEffectiveRestrictSkills)({
                restrictSkills: agent.restrictSkills,
            }, {
                skillBindings: skillWhitelistIds.length,
            });
            const skills = (skillVisibilityTightened
                ? skillWhitelistIds
                    .map((skillId) => appActiveSkillById.get(skillId))
                    .filter((skill) => skill != null)
                : appActiveSkills).slice(0, 20);
            candidates.push({
                id: agent.id,
                name: agent.name,
                description: agent.description,
                config: agent.config,
                tools,
                skills,
                hostTools: hostTools.map((hostTool) => {
                    var _a, _b;
                    return ({
                        id: hostTool.id,
                        name: hostTool.name,
                        description: hostTool.description,
                        definitionKey: hostTool.definitionKey,
                        hostPageScope: (_b = (_a = hostTool.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
                    });
                }),
            });
        }
        return candidates;
    }
    scoreCandidates(candidates, input) {
        var _a;
        const pageScope = (0, page_context_anchor_util_1.resolveHostToolPageScope)((_a = input.pageContext) !== null && _a !== void 0 ? _a : null);
        return candidates
            .map((candidate) => {
            var _a, _b, _c;
            let score = 0;
            const reasons = [];
            const configuredDefault = isConfiguredDefault(candidate.config);
            if (configuredDefault) {
                score += 10;
                reasons.push('configured default');
            }
            if (pageScope &&
                candidate.hostTools.some((tool) => tool.hostPageScope === pageScope)) {
                score += 40;
                reasons.push(`host page scope matched (${pageScope})`);
            }
            const searchable = [
                candidate.name,
                (_a = candidate.description) !== null && _a !== void 0 ? _a : '',
            ];
            for (const skill of candidate.skills) {
                searchable.push(skill.name, (_b = skill.description) !== null && _b !== void 0 ? _b : '', (_c = skill.capabilityKey) !== null && _c !== void 0 ? _c : '');
            }
            for (const tool of candidate.tools) {
                searchable.push(tool.name, tool.description, tool.definitionKey);
                collectText(tool.agentMetadata, searchable);
            }
            for (const hostTool of candidate.hostTools) {
                searchable.push(hostTool.name, hostTool.description, hostTool.definitionKey);
            }
            const textScore = textSimilarityScore({
                query: input.userMessage,
                target: searchable.join('\n'),
                maxScore: 50,
            });
            if (textScore > 0) {
                score += textScore;
                reasons.push(`capability text matched (${textScore})`);
            }
            return Object.assign(Object.assign({}, candidate), { score,
                reasons, isConfiguredDefault: configuredDefault });
        })
            .sort((left, right) => right.score - left.score || left.id - right.id);
    }
    async resolveUserRoleToolContext(userId, appClientId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`user ${userId} not found`);
        }
        const userApp = await this.prisma.userApp.findFirst({
            where: { userId: user.id, appId: appClientId },
            select: {
                roleId: true,
                role: {
                    select: {
                        allowToolLevel: true,
                        roleTools: { select: { toolId: true } },
                    },
                },
            },
        });
        if (!userApp) {
            return null;
        }
        return {
            roleId: userApp.roleId,
            maxLevel: (0, agent_client_access_util_1.resolveMaxToolLevel)([userApp.role.allowToolLevel]),
            roleToolIds: userApp.role.roleTools.map((row) => row.toolId),
        };
    }
    async assertAgentBelongsToApp(agentId, appClientId) {
        const agent = await this.prisma.agent.findFirst({
            where: { id: agentId, appClientId },
            select: { id: true },
        });
        if (!agent) {
            throw new common_1.BadRequestException(`agent ${agentId} not found or does not belong to this app client`);
        }
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`appClient ${appClientId} not found`);
        }
    }
}
exports.AgentAutoSelectService = AgentAutoSelectService;
//# sourceMappingURL=agent-auto-select.service.js.map