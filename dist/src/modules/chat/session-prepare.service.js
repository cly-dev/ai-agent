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
var SessionPrepareService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionPrepareService = void 0;
const common_1 = require("@nestjs/common");
const page_context_anchor_util_1 = require("../../core/host-bridge/page-context-anchor.util");
const prompt_composer_service_1 = require("../../core/prompt/prompt-composer.service");
const parse_page_context_util_1 = require("../../core/host-bridge/parse-page-context.util");
const agent_host_tool_catalog_service_1 = require("../../core/runtime-cache/agent-host-tool-catalog.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const agent_service_1 = require("../agent/agent.service");
const session_prepare_store_1 = require("./session-prepare.store");
const session_runtime_resolver_service_1 = require("./session-runtime-resolver.service");
let SessionPrepareService = SessionPrepareService_1 = class SessionPrepareService {
    constructor(prisma, agentService, promptComposer, sessionPrepareStore, sessionRuntimeResolver, hostToolCatalogService) {
        this.prisma = prisma;
        this.agentService = agentService;
        this.promptComposer = promptComposer;
        this.sessionPrepareStore = sessionPrepareStore;
        this.sessionRuntimeResolver = sessionRuntimeResolver;
        this.hostToolCatalogService = hostToolCatalogService;
        this.logger = new common_1.Logger(SessionPrepareService_1.name);
    }
    warmInBackground(sessionId, userId, appClientId, pageContext) {
        void this.warm(sessionId, userId, appClientId, pageContext).catch((error) => {
            this.logger.warn(`session prepare background warm failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        });
    }
    resolvePageContextFromPrepareDto(dto) {
        if (!dto) {
            return null;
        }
        return (0, parse_page_context_util_1.parsePageContextFromMessageFields)(dto);
    }
    async warm(sessionId, userId, appClientId, pageContext) {
        var _a, _b;
        const normalizedSessionId = this.normalizeSessionId(sessionId);
        const session = await this.prisma.session.findFirst({
            where: {
                id: normalizedSessionId,
                userId,
                appClientId,
            },
            select: { id: true, agentId: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('chat not found');
        }
        const pageScope = (0, page_context_anchor_util_1.resolveHostToolPageScope)(pageContext);
        if (session.agentId) {
            const bundle = await this.sessionRuntimeResolver.resolveAllowedToolsBundle({
                sessionId: session.id,
                agentId: session.agentId,
                userId,
                appClientId,
            });
            const cachedSnapshot = await this.sessionPrepareStore.get(session.id, userId, appClientId, session.agentId, bundle.revision);
            if (bundle.fromCache && cachedSnapshot) {
                const hostToolsCount = pageScope && ((_a = cachedSnapshot.hostToolsByPage) === null || _a === void 0 ? void 0 : _a[pageScope])
                    ? cachedSnapshot.hostToolsByPage[pageScope].llmTools.length
                    : 0;
                const needsHostPageWarm = pageScope != null && !((_b = cachedSnapshot.hostToolsByPage) === null || _b === void 0 ? void 0 : _b[pageScope]);
                if (!needsHostPageWarm) {
                    return {
                        sessionId: session.id,
                        prepared: true,
                        agentReady: true,
                        toolsCount: bundle.tools.length,
                        skillsCount: bundle.skillRows.length,
                        hostToolsCount,
                        pageScope,
                        sessionContextWarmed: await this.promptComposer.warmSessionContext(session.id),
                        warmedAt: cachedSnapshot.snapshot.warmedAt,
                        fromCache: true,
                        revision: bundle.revision,
                    };
                }
            }
            const [agent, sessionContextWarmed, llmHostTools] = await Promise.all([
                this.agentService.getRuntimeAgent(appClientId, session.agentId),
                this.promptComposer.warmSessionContext(session.id),
                pageScope
                    ? this.hostToolCatalogService.warmPageLlmTools({
                        appClientId,
                        agentId: session.agentId,
                        pageScope,
                    })
                    : Promise.resolve([]),
            ]);
            const hostToolsByPage = pageScope != null
                ? {
                    [pageScope]: {
                        pageScope,
                        routePath: pageContext === null || pageContext === void 0 ? void 0 : pageContext.routePath,
                        routeParams: pageContext === null || pageContext === void 0 ? void 0 : pageContext.routeParams,
                        llmTools: llmHostTools,
                        warmedAt: new Date().toISOString(),
                    },
                }
                : undefined;
            if (hostToolsByPage) {
                await this.sessionPrepareStore.trySet({
                    sessionId: session.id,
                    userId,
                    appClientId,
                    agentId: session.agentId,
                    revision: bundle.revision,
                    tools: bundle.tools,
                    skills: bundle.skillRows,
                    hostToolsByPage,
                    lastPreparedPage: pageScope !== null && pageScope !== void 0 ? pageScope : undefined,
                });
            }
            return {
                sessionId: session.id,
                prepared: true,
                agentReady: agent != null,
                toolsCount: bundle.tools.length,
                skillsCount: bundle.skillRows.length,
                hostToolsCount: llmHostTools.length,
                pageScope,
                sessionContextWarmed,
                warmedAt: new Date().toISOString(),
                fromCache: bundle.fromCache && !hostToolsByPage,
                revision: bundle.revision,
            };
        }
        const warmedAt = new Date().toISOString();
        const sessionContextWarmed = await this.promptComposer.warmSessionContext(session.id);
        return {
            sessionId: session.id,
            prepared: sessionContextWarmed,
            agentReady: false,
            toolsCount: 0,
            skillsCount: 0,
            hostToolsCount: 0,
            pageScope: null,
            sessionContextWarmed,
            warmedAt,
            fromCache: false,
        };
    }
    normalizeSessionId(sessionId) {
        const value = sessionId.trim().toLowerCase();
        if (!SessionPrepareService_1.SESSION_ID_HEX.test(value)) {
            throw new common_1.BadRequestException('sessionId must be a 32-character lowercase hex string');
        }
        return value;
    }
};
SessionPrepareService.SESSION_ID_HEX = /^[a-f0-9]{32}$/;
SessionPrepareService = SessionPrepareService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        agent_service_1.AgentService,
        prompt_composer_service_1.PromptComposerService,
        session_prepare_store_1.SessionPrepareStore,
        session_runtime_resolver_service_1.SessionRuntimeResolverService,
        agent_host_tool_catalog_service_1.AgentHostToolCatalogService])
], SessionPrepareService);
exports.SessionPrepareService = SessionPrepareService;
//# sourceMappingURL=session-prepare.service.js.map