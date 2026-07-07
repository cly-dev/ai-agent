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
exports.SessionRuntimeResolverService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_service_1 = require("../agent/agent.service");
const skill_service_1 = require("../../core/skill/skill.service");
const agent_host_tool_catalog_service_1 = require("../../core/runtime-cache/agent-host-tool-catalog.service");
const agent_tool_catalog_service_1 = require("../../core/runtime-cache/agent-tool-catalog.service");
const runtime_revision_util_1 = require("../../core/runtime-cache/runtime-revision.util");
const runtime_cache_observability_util_1 = require("../../core/runtime-cache/runtime-cache-observability.util");
const session_prepare_util_1 = require("./session-prepare.util");
const session_prepare_store_1 = require("./session-prepare.store");
const IN_PROCESS_BUNDLE_TTL_MS = 60000;
let SessionRuntimeResolverService = class SessionRuntimeResolverService {
    constructor(prisma, agentService, skillService, sessionPrepareStore, hostToolCatalogService, agentToolCatalogService) {
        this.prisma = prisma;
        this.agentService = agentService;
        this.skillService = skillService;
        this.sessionPrepareStore = sessionPrepareStore;
        this.hostToolCatalogService = hostToolCatalogService;
        this.agentToolCatalogService = agentToolCatalogService;
        this.inProcessBundles = new Map();
    }
    invalidateSession(sessionId) {
        for (const key of this.inProcessBundles.keys()) {
            if (key.startsWith(`${sessionId}:`)) {
                this.inProcessBundles.delete(key);
            }
        }
    }
    async resolveAllowedToolsBundle(input) {
        const memKey = this.inProcessKey(input);
        const memHit = this.inProcessBundles.get(memKey);
        if (memHit && memHit.expiresAt > Date.now()) {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L0',
                operation: 'resolveAllowedToolsBundle',
                cacheHit: true,
                sessionId: input.sessionId,
                agentId: input.agentId,
                appClientId: input.appClientId,
                extra: { source: 'in_process' },
            });
            return Object.assign(Object.assign({}, memHit.bundle), { fromCache: true });
        }
        const cached = await this.sessionPrepareStore.get(input.sessionId, input.userId, input.appClientId, input.agentId);
        if (cached) {
            const freshRevision = await this.fetchLightweightRevision(input.appClientId, input.agentId, cached.skills.map((row) => row.id));
            if ((0, session_prepare_util_1.areSessionRuntimeRevisionsEqual)(cached.revision, freshRevision)) {
                const bundle = {
                    tools: cached.tools,
                    skillRows: cached.skills,
                    revision: cached.revision,
                    fromCache: true,
                };
                this.rememberInProcess(memKey, bundle);
                (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                    layer: 'L1',
                    operation: 'resolveAllowedToolsBundle',
                    cacheHit: true,
                    sessionId: input.sessionId,
                    agentId: input.agentId,
                    appClientId: input.appClientId,
                });
                return bundle;
            }
            await this.sessionPrepareStore.delete(input.sessionId);
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L1',
                operation: 'resolveAllowedToolsBundle',
                cacheHit: false,
                revisionMismatch: true,
                sessionId: input.sessionId,
                agentId: input.agentId,
                appClientId: input.appClientId,
            });
        }
        else {
            (0, runtime_cache_observability_util_1.logRuntimeCacheEvent)({
                layer: 'L1',
                operation: 'resolveAllowedToolsBundle',
                cacheHit: false,
                sessionId: input.sessionId,
                agentId: input.agentId,
                appClientId: input.appClientId,
            });
        }
        const bundle = await this.loadFreshBundle(input);
        this.rememberInProcess(memKey, bundle);
        await this.sessionPrepareStore.trySet({
            sessionId: input.sessionId,
            userId: input.userId,
            appClientId: input.appClientId,
            agentId: input.agentId,
            revision: bundle.revision,
            tools: bundle.tools,
            skills: bundle.skillRows,
        });
        return bundle;
    }
    async loadFreshBundle(input) {
        const freshTools = await this.agentService.getAllowedTools(input.agentId, input.userId, input.appClientId);
        const freshSkills = await this.skillService.listRunnableAgentSkillsForUser({
            agentId: input.agentId,
            userId: input.userId,
            appClientId: input.appClientId,
        }, new Set(freshTools.map((tool) => tool.id)));
        const skillRows = await this.loadSkillRevisionRows(freshSkills.map((skill) => skill.id));
        const hostToolsRevision = await this.hostToolCatalogService.fetchRevisionFromDb(input.appClientId, input.agentId);
        const revision = (0, session_prepare_util_1.buildSessionRuntimeRevision)({
            tools: freshTools,
            skills: skillRows,
            hostToolsRevision,
        });
        return {
            tools: freshTools,
            skillRows,
            revision,
            fromCache: false,
        };
    }
    async fetchLightweightRevision(appClientId, agentId, cachedSkillIds) {
        const [hostToolsRevision, toolParts, skillRows] = await Promise.all([
            this.hostToolCatalogService.fetchRevisionFromDb(appClientId, agentId),
            this.agentToolCatalogService.fetchRuntimeRevisionParts(appClientId, agentId),
            this.loadSkillRevisionRows(cachedSkillIds),
        ]);
        return {
            tools: toolParts.tools,
            integrations: toolParts.integrations,
            skills: (0, runtime_revision_util_1.buildSkillsRuntimeRevision)(skillRows),
            hostTools: hostToolsRevision,
        };
    }
    async loadSkillRevisionRows(skillIds) {
        if (skillIds.length === 0) {
            return [];
        }
        const rows = await this.prisma.skill.findMany({
            where: { id: { in: skillIds } },
            select: { id: true, name: true, updatedAt: true },
            orderBy: { id: 'asc' },
        });
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            updatedAt: row.updatedAt.toISOString(),
        }));
    }
    inProcessKey(input) {
        return `${input.sessionId}:${input.agentId}:${input.userId}:${input.appClientId}`;
    }
    rememberInProcess(memKey, bundle) {
        this.inProcessBundles.set(memKey, {
            bundle,
            expiresAt: Date.now() + IN_PROCESS_BUNDLE_TTL_MS,
        });
    }
};
SessionRuntimeResolverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_service_1.AgentService,
        skill_service_1.SkillService,
        session_prepare_store_1.SessionPrepareStore,
        agent_host_tool_catalog_service_1.AgentHostToolCatalogService,
        agent_tool_catalog_service_1.AgentToolCatalogService])
], SessionRuntimeResolverService);
exports.SessionRuntimeResolverService = SessionRuntimeResolverService;
//# sourceMappingURL=session-runtime-resolver.service.js.map