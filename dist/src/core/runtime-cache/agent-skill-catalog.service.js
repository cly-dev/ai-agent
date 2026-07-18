"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentSkillCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSkillCatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_skill_catalog_store_1 = require("./agent-skill-catalog.store");
const agent_capability_load_util_1 = require("./agent-capability-load.util");
const capability_candidate_util_1 = require("./capability-candidate.util");
const runtime_cache_observability_util_1 = require("./runtime-cache-observability.util");
const runtime_revision_util_1 = require("./runtime-revision.util");
let AgentSkillCatalogService = AgentSkillCatalogService_1 = class AgentSkillCatalogService {
    constructor(prisma, catalogStore) {
        this.prisma = prisma;
        this.catalogStore = catalogStore;
        this.logger = new common_1.Logger(AgentSkillCatalogService_1.name);
    }
    async listAgentSkillsForUser(input) {
        const roleContext = await this.resolveRoleContext(input.userId, input.appClientId);
        if (!roleContext) {
            return [];
        }
        const catalog = await this.loadOrWarm({
            appClientId: input.appClientId,
            agentId: input.agentId,
            roleId: roleContext.roleId,
            roleSkillFiltered: roleContext.roleSkillFiltered,
        });
        if (!catalog) {
            return [];
        }
        const runnableHostToolIds = new Set(catalog.runnableHostToolIds);
        return catalog.skills.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            capabilityKey: row.capabilityKey,
            riskLevel: row.riskLevel,
            toolIds: row.toolIds,
            hostToolIds: row.skillHostToolIds.filter((hostToolId) => runnableHostToolIds.has(hostToolId)),
            workflowId: row.workflowId,
            workflowVersion: row.workflowVersion,
            flowId: row.flowId,
            flowVersion: row.flowVersion,
        }));
    }
    async loadOrWarm(input) {
        const dbRevision = await this.fetchRevisionFromDb(input);
        const cached = await this.catalogStore.get(input.appClientId, input.agentId, input.roleId);
        if (cached && cached.revision === dbRevision) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L2',
                operation: 'loadAgentSkillCatalog',
                cacheHit: true,
                agentId: input.agentId,
                appClientId: input.appClientId,
                extra: { roleId: input.roleId },
            });
            return cached;
        }
        if (cached && cached.revision !== dbRevision) {
            this.logger.debug(`skill catalog revision mismatch agentId=${input.agentId} roleId=${input.roleId}, refreshing`);
            return this.refresh(input);
        }
        const built = await this.buildFromDb(input);
        if (!built) {
            return null;
        }
        await this.catalogStore.trySet(built);
        (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
            layer: 'L2',
            operation: 'loadAgentSkillCatalog',
            cacheHit: false,
            agentId: input.agentId,
            appClientId: input.appClientId,
            extra: { roleId: input.roleId },
        });
        return built;
    }
    async refresh(input) {
        const built = await this.buildFromDb(input);
        if (!built) {
            return null;
        }
        await this.catalogStore.trySet(built);
        return built;
    }
    async fetchRevisionFromDb(input) {
        const skills = await this.querySkills(input);
        const skillPart = (0, runtime_revision_util_1.buildEntityRevisionsFingerprint)(skills.map((row) => ({ id: row.id, updatedAt: row.updatedAt })));
        const hostCandidateIds = await (0, agent_capability_load_util_1.loadAgentHostToolCandidateIds)(this.prisma, input.appClientId, input.agentId);
        const hostPart = hostCandidateIds.join(',');
        const skillCtx = await (0, agent_capability_load_util_1.loadAgentSkillVisibilityContext)(this.prisma, input.appClientId, input.agentId);
        return `s:${skillPart}|h:${hostPart}|r:${input.roleId}|rs:${skillCtx.restrictSkills ? 1 : 0}`;
    }
    async buildFromDb(input) {
        const agent = await this.prisma.agent.findFirst({
            where: { id: input.agentId, appClientId: input.appClientId },
            select: { id: true },
        });
        if (!agent) {
            return null;
        }
        const [skills, runnableHostToolIds] = await Promise.all([
            this.querySkills(input),
            (0, agent_capability_load_util_1.loadAgentHostToolCandidateIds)(this.prisma, input.appClientId, input.agentId),
        ]);
        const catalogSkills = skills.map((row) => ({
            id: row.id,
            name: row.name,
            description: row.description,
            capabilityKey: row.capabilityKey,
            riskLevel: row.riskLevel,
            updatedAt: (0, runtime_revision_util_1.toRevisionIso)(row.updatedAt),
            toolIds: row.skillTools.map((skillTool) => skillTool.toolId),
            skillHostToolIds: row.skillHostTools.map((binding) => binding.hostToolId),
            workflowId: row.workflowId,
            workflowVersion: row.workflowVersion,
            flowId: row.flowId,
            flowVersion: row.flowVersion,
        }));
        return {
            appClientId: input.appClientId,
            agentId: input.agentId,
            roleId: input.roleId,
            revision: await this.fetchRevisionFromDb(input),
            skills: catalogSkills,
            runnableHostToolIds,
            warmedAt: new Date().toISOString(),
        };
    }
    async querySkills(input) {
        const skillCtx = await (0, agent_capability_load_util_1.loadAgentSkillVisibilityContext)(this.prisma, input.appClientId, input.agentId);
        return this.prisma.skill.findMany({
            where: Object.assign(Object.assign({}, (0, capability_candidate_util_1.buildAgentSkillVisibilityWhere)({
                appClientId: input.appClientId,
                agentId: input.agentId,
                restrictSkills: skillCtx.restrictSkills,
                skillWhitelistIds: skillCtx.skillWhitelistIds,
            })), (input.roleSkillFiltered
                ? { roleSkills: { some: { roleId: input.roleId } } }
                : {})),
            select: {
                id: true,
                name: true,
                description: true,
                capabilityKey: true,
                riskLevel: true,
                updatedAt: true,
                workflowId: true,
                workflowVersion: true,
                flowId: true,
                flowVersion: true,
                skillTools: { select: { toolId: true } },
                skillHostTools: { select: { hostToolId: true } },
            },
            orderBy: { id: 'asc' },
        });
    }
    async resolveRoleContext(userId, appClientId) {
        const userApp = await this.prisma.userApp.findFirst({
            where: { userId, appId: appClientId },
            select: { roleId: true },
        });
        if (!userApp) {
            return null;
        }
        const roleSkillCount = await this.prisma.roleSkill.count({
            where: { roleId: userApp.roleId },
        });
        return {
            roleId: userApp.roleId,
            roleSkillFiltered: roleSkillCount > 0,
        };
    }
};
AgentSkillCatalogService = AgentSkillCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_skill_catalog_store_1.AgentSkillCatalogStore])
], AgentSkillCatalogService);
exports.AgentSkillCatalogService = AgentSkillCatalogService;
//# sourceMappingURL=agent-skill-catalog.service.js.map