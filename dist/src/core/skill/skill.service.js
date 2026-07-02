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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillService = void 0;
const common_1 = require("@nestjs/common");
const agent_skill_catalog_service_1 = require("../runtime-cache/agent-skill-catalog.service");
const tool_engine_service_1 = require("../tool-engine/tool-engine.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const skill_runnable_util_1 = require("./skill-runnable.util");
const capability_candidate_util_1 = require("../runtime-cache/capability-candidate.util");
const agent_capability_load_util_1 = require("../runtime-cache/agent-capability-load.util");
const resolve_skill_workflow_plan_util_1 = require("../workflow/resolve-skill-workflow-plan.util");
let SkillService = class SkillService {
    constructor(prisma, toolEngine, agentSkillCatalogService) {
        this.prisma = prisma;
        this.toolEngine = toolEngine;
        this.agentSkillCatalogService = agentSkillCatalogService;
    }
    async getRunnableSkillDetailById(input) {
        const roleContext = await this.resolveRoleContext(input.userId, input.appClientId);
        if (!roleContext) {
            return null;
        }
        const [rows, runnableHostToolIds] = await Promise.all([
            this.queryAgentSkills({
                appClientId: input.appClientId,
                agentId: input.agentId,
                roleId: roleContext.roleId,
                roleSkillFiltered: roleContext.roleSkillFiltered,
                skillId: input.skillId,
            }),
            this.loadAgentRunnableHostToolIds(input.appClientId, input.agentId),
        ]);
        const row = rows[0];
        if (!row) {
            return null;
        }
        const scopedHostToolIdSet = this.toScopedHostToolIdSet(input.scopedHostToolIds, runnableHostToolIds);
        return this.toAvailableSkillRowIfResolvable(row, runnableHostToolIds, new Set(input.scopedTools.map((tool) => tool.id)), scopedHostToolIdSet, input.forRequestedSkill === true);
    }
    async getAvailableSkillById(input) {
        return this.getRunnableSkillDetailById(input);
    }
    async resolveSkillsForOuterPlan(input) {
        const skills = await this.listResolvableSkillsForScopedTools(input);
        const requestedSkillId = input.requestedSkillId;
        if (requestedSkillId == null ||
            skills.some((skill) => skill.id === requestedSkillId)) {
            return skills;
        }
        const requested = await this.getRunnableSkillDetailById({
            agentId: input.agentId,
            userId: input.userId,
            appClientId: input.appClientId,
            skillId: requestedSkillId,
            scopedTools: input.scopedTools,
            scopedHostToolIds: input.scopedHostToolIds,
            forRequestedSkill: true,
        });
        if (!requested) {
            return skills;
        }
        return [...skills, requested];
    }
    async listResolvableSkillsForScopedTools(input) {
        const roleContext = await this.resolveRoleContext(input.userId, input.appClientId);
        if (!roleContext) {
            return [];
        }
        const scopedToolIds = new Set(input.scopedTools.map((tool) => tool.id));
        const queryBase = {
            appClientId: input.appClientId,
            agentId: input.agentId,
            roleId: roleContext.roleId,
            roleSkillFiltered: roleContext.roleSkillFiltered,
        };
        const runnableHostToolIds = await this.loadAgentRunnableHostToolIds(input.appClientId, input.agentId);
        const scopedHostToolIdSet = this.toScopedHostToolIdSet(input.scopedHostToolIds, runnableHostToolIds);
        const httpRows = scopedToolIds.size > 0
            ? await this.queryAgentSkills(Object.assign(Object.assign({}, queryBase), { toolIdFilter: [...scopedToolIds] }))
            : [];
        const hostRows = scopedHostToolIdSet.size > 0
            ? await this.queryPureHostSkills(Object.assign(Object.assign({}, queryBase), { hostToolIdFilter: [...scopedHostToolIdSet] }))
            : [];
        const hostBoundRows = scopedHostToolIdSet.size > 0
            ? await this.queryHostBoundSkills(Object.assign(Object.assign({}, queryBase), { hostToolIdFilter: [...scopedHostToolIdSet] }))
            : [];
        const rows = this.mergeSkillDbRows(httpRows, hostRows, hostBoundRows);
        return rows
            .map((row) => this.toAvailableSkillRowIfResolvable(row, runnableHostToolIds, scopedToolIds, scopedHostToolIdSet, false))
            .filter((row) => row != null)
            .map((row) => this.narrowHostToolIdsToPageScope(row, scopedHostToolIdSet));
    }
    async listAvailableSkillsForScopedTools(input) {
        return this.listResolvableSkillsForScopedTools(input);
    }
    async listAgentSkillsForUser(input) {
        return this.agentSkillCatalogService.listAgentSkillsForUser(input);
    }
    async listRunnableAgentSkillsForUser(input, allowedToolIds) {
        const rows = await this.listAgentSkillsForUser(input);
        return rows.filter((skill) => (0, skill_runnable_util_1.skillIsWorkflowBound)(skill) ||
            (0, skill_runnable_util_1.skillIsRunnableForUser)(skill, allowedToolIds));
    }
    bindSkillToScopedTools(skill, scopedTools, toolBuildCtx) {
        const skillToolIds = new Set('skillToolIds' in skill
            ? skill.skillToolIds
            : skill.skillTools.map((row) => row.toolId));
        const narrowed = scopedTools.filter((tool) => skillToolIds.has(tool.id));
        const scopedAllowedToolIds = narrowed.map((tool) => tool.id);
        const scopedToolBundle = this.toolEngine.buildLangChainTools(narrowed, Object.assign(Object.assign({}, toolBuildCtx), { allowedToolIds: scopedAllowedToolIds }));
        return {
            scopedTools: narrowed,
            scopedAllowedToolIds,
            scopedToolBundle,
        };
    }
    async tryBuildTaskPlanFromSkillWorkflow(input) {
        if (input.skill.workflowId == null || input.skill.workflowId <= 0) {
            return null;
        }
        return (0, resolve_skill_workflow_plan_util_1.tryBuildTaskPlanFromSkillWorkflow)(this.prisma, {
            appClientId: input.appClientId,
            userMessage: input.userMessage,
            binding: {
                workflowId: input.skill.workflowId,
                workflowVersion: input.skill.workflowVersion,
                workflowOverrides: input.skill.workflowOverrides,
            },
            goal: input.goal,
            allowedToolIds: input.allowedToolIds,
            allowedHostToolIds: input.allowedHostToolIds,
        });
    }
    async queryHostBoundSkills(input) {
        if (input.hostToolIdFilter.length === 0) {
            return [];
        }
        return this.queryAgentSkills({
            appClientId: input.appClientId,
            agentId: input.agentId,
            roleId: input.roleId,
            roleSkillFiltered: input.roleSkillFiltered,
            hostToolIdFilter: input.hostToolIdFilter,
            hostBoundWithHttp: true,
        });
    }
    narrowHostToolIdsToPageScope(row, scopedHostToolIds) {
        if (scopedHostToolIds.size === 0) {
            return row;
        }
        const hostToolIds = row.hostToolIds.filter((hostToolId) => scopedHostToolIds.has(hostToolId));
        return Object.assign(Object.assign({}, row), { hostToolIds, runnableKind: (0, skill_runnable_util_1.deriveSkillRunnableKind)({
                skillToolIds: row.skillToolIds,
                hostToolIds,
            }) });
    }
    async queryPureHostSkills(input) {
        if (input.hostToolIdFilter.length === 0) {
            return [];
        }
        return this.queryAgentSkills({
            appClientId: input.appClientId,
            agentId: input.agentId,
            roleId: input.roleId,
            roleSkillFiltered: input.roleSkillFiltered,
            pureHostOnly: true,
            hostToolIdFilter: input.hostToolIdFilter,
        });
    }
    toScopedHostToolIdSet(scopedHostToolIds, runnableHostToolIds) {
        if (!(scopedHostToolIds === null || scopedHostToolIds === void 0 ? void 0 : scopedHostToolIds.length)) {
            return new Set();
        }
        return new Set(scopedHostToolIds.filter((hostToolId) => runnableHostToolIds.has(hostToolId)));
    }
    mergeSkillDbRows(...groups) {
        const byId = new Map();
        for (const rows of groups) {
            for (const row of rows) {
                byId.set(row.id, row);
            }
        }
        return [...byId.values()];
    }
    toAvailableSkillRowIfResolvable(row, runnableHostToolIds, scopedToolIds, scopedHostToolIds, forRequestedSkill) {
        const skillToolIds = row.skillTools.map((skillTool) => skillTool.toolId);
        const hostToolIds = this.resolveRunnableHostToolIds(row, runnableHostToolIds);
        const caps = {
            skillToolIds,
            hostToolIds,
            workflowId: row.workflowId,
        };
        const resolvable = forRequestedSkill
            ? (0, skill_runnable_util_1.skillIsResolvableForRequested)(caps)
            : (0, skill_runnable_util_1.skillIsResolvableInScope)(caps, scopedToolIds, scopedHostToolIds);
        if (!resolvable) {
            return null;
        }
        return this.narrowHostToolIdsToPageScope(this.toAvailableSkillRow(row, hostToolIds), scopedHostToolIds);
    }
    async loadAgentRunnableHostToolIds(appClientId, agentId) {
        const ids = await (0, agent_capability_load_util_1.loadAgentHostToolCandidateIds)(this.prisma, appClientId, agentId);
        return new Set(ids);
    }
    resolveRunnableHostToolIds(row, runnableHostToolIds) {
        return row.skillHostTools
            .map((binding) => binding.hostToolId)
            .filter((hostToolId) => runnableHostToolIds.has(hostToolId));
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
    async queryAgentSkills(input) {
        var _a;
        const hostToolIdFilter = (_a = input.hostToolIdFilter) !== null && _a !== void 0 ? _a : [];
        const skillCtx = await (0, agent_capability_load_util_1.loadAgentSkillVisibilityContext)(this.prisma, input.appClientId, input.agentId);
        return this.prisma.skill.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign({}, (0, capability_candidate_util_1.buildAgentSkillVisibilityWhere)({
                appClientId: input.appClientId,
                agentId: input.agentId,
                restrictSkills: skillCtx.restrictSkills,
                skillWhitelistIds: skillCtx.skillWhitelistIds,
            })), (input.skillId != null ? { id: input.skillId } : {})), (input.pureHostOnly
                ? {
                    skillTools: { none: {} },
                    skillHostTools: {
                        some: { hostToolId: { in: hostToolIdFilter } },
                    },
                }
                : input.hostBoundWithHttp && hostToolIdFilter.length > 0
                    ? {
                        skillTools: { some: {} },
                        skillHostTools: {
                            some: { hostToolId: { in: hostToolIdFilter } },
                        },
                    }
                    : input.toolIdFilter && input.toolIdFilter.length > 0
                        ? {
                            skillTools: {
                                some: { toolId: { in: input.toolIdFilter } },
                            },
                        }
                        : {})), (input.roleSkillFiltered
                ? { roleSkills: { some: { roleId: input.roleId } } }
                : {})),
            select: {
                id: true,
                name: true,
                description: true,
                prompt: true,
                config: true,
                riskLevel: true,
                capabilityKey: true,
                workflowId: true,
                workflowVersion: true,
                workflowOverrides: true,
                skillTools: { select: { toolId: true } },
                skillHostTools: { select: { hostToolId: true } },
            },
        });
    }
    toActiveSkillSnapshot(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            prompt: row.prompt,
            config: row.config,
            riskLevel: row.riskLevel,
            capabilityKey: row.capabilityKey,
        };
    }
    toAvailableSkillRow(row, hostToolIds) {
        const skillToolIds = row.skillTools.map((skillTool) => skillTool.toolId);
        return Object.assign(Object.assign({}, this.toActiveSkillSnapshot(row)), { skillToolIds,
            hostToolIds, runnableKind: (0, skill_runnable_util_1.deriveSkillRunnableKind)({ skillToolIds, hostToolIds }), workflowId: row.workflowId, workflowVersion: row.workflowVersion, workflowOverrides: row.workflowOverrides });
    }
};
SkillService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tool_engine_service_1.ToolEngineService,
        agent_skill_catalog_service_1.AgentSkillCatalogService])
], SkillService);
exports.SkillService = SkillService;
//# sourceMappingURL=skill.service.js.map