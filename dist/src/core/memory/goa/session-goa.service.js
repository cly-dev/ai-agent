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
var SessionGoaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionGoaService = void 0;
const common_1 = require("@nestjs/common");
const session_goa_ledger_util_1 = require("./session-goa-ledger.util");
const session_goa_projection_util_1 = require("./session-goa-projection.util");
const session_goa_full_projection_util_1 = require("./session-goa-full-projection.util");
const host_bridge_1 = require("../../host-bridge");
const parse_page_context_util_1 = require("../../host-bridge/parse-page-context.util");
const session_goa_store_1 = require("./session-goa.store");
const session_goa_types_1 = require("./session-goa.types");
let SessionGoaService = SessionGoaService_1 = class SessionGoaService {
    constructor(goaStore) {
        this.goaStore = goaStore;
        this.logger = new common_1.Logger(SessionGoaService_1.name);
    }
    async getPayload(sessionId) {
        return this.goaStore.get(sessionId);
    }
    async ensurePayload(sessionId) {
        return this.goaStore.warm(sessionId);
    }
    async refreshFromAgentRun(sessionId, ctx) {
        const written = await this.appendFromAgentRun(sessionId, ctx);
        if (!written) {
            this.logger.warn(`session GOA write failed sessionId=${sessionId}`);
        }
    }
    async appendFromAgentRun(sessionId, ctx) {
        try {
            for (let attempt = 0; attempt < 2; attempt += 1) {
                const base = await this.goaStore.get(sessionId);
                const merged = this.buildMergedPayload(base, ctx);
                const saved = await this.goaStore.saveIfUnchanged(sessionId, merged.payload, base.updatedAt);
                if (saved) {
                    return merged.episode ? { episode: merged.episode } : null;
                }
                this.logger.warn(`session GOA save conflict retry sessionId=${sessionId} attempt=${attempt + 1}`);
            }
            return null;
        }
        catch (error) {
            this.logger.warn(`session GOA skipped sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    buildMergedPayload(base, ctx) {
        var _a;
        const artifacts = (0, session_goa_projection_util_1.buildArtifactsFromAgentRun)(ctx);
        const builtTask = (0, session_goa_projection_util_1.buildActiveTaskFromAgentRun)({
            ctx,
            artifacts,
            prev: base.activeTask,
        });
        const activeTask = (0, session_goa_projection_util_1.resolvePersistedActiveTask)({
            base,
            built: builtTask,
            ctx,
        });
        const entities = (0, session_goa_projection_util_1.mergeSessionEntities)(base.entities, ctx.userInput);
        const sessionArtifacts = (0, session_goa_projection_util_1.appendArtifactsFifo)(base.sessionArtifacts, artifacts);
        const ledgerIncoming = (0, session_goa_ledger_util_1.buildObservationLedgerEntriesFromContext)({
            turnId: ctx.turnId,
            runId: ctx.runId,
            newToolObservations: ctx.newToolObservations,
        });
        const sessionObservationLedger = (0, session_goa_ledger_util_1.appendSessionObservationLedger)((_a = base.sessionObservationLedger) !== null && _a !== void 0 ? _a : [], ledgerIncoming);
        if (ctx.phase === 'task_only') {
            return {
                payload: Object.assign(Object.assign({}, base), { sessionArtifacts,
                    sessionObservationLedger,
                    activeTask,
                    entities }),
                episode: null,
            };
        }
        const episode = (0, session_goa_projection_util_1.buildTurnEpisodeFromAgentRun)(ctx, artifacts);
        const recentEpisodes = (0, session_goa_projection_util_1.appendEpisodeFifo)(base.recentEpisodes, episode);
        return {
            payload: Object.assign(Object.assign({}, base), { recentEpisodes,
                sessionArtifacts,
                sessionObservationLedger,
                activeTask,
                entities }),
            episode,
        };
    }
    buildPromptMessages(payload) {
        return (0, session_goa_full_projection_util_1.buildFullSessionGoaPromptMessages)(payload);
    }
    async buildPromptMessagesForSession(sessionId) {
        const payload = await this.getPayload(sessionId);
        return this.buildPromptMessages(payload);
    }
    shouldResumeTaskPlan(payload, intentKind) {
        if (intentKind !== 'task') {
            return false;
        }
        if (!(0, session_goa_types_1.isActiveTaskChatResumable)(payload.activeTask)) {
            return false;
        }
        return payload.activeTask != null;
    }
    buildPriorToolObservationsForGraph(payload) {
        return (0, session_goa_ledger_util_1.mergePriorToolObservationsFromGoa)(payload);
    }
    async syncHostPageContext(sessionId, incoming) {
        const normalizedIncoming = incoming
            ? (0, parse_page_context_util_1.parsePageContextFromMessageFields)({ pageContext: incoming })
            : null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            const base = await this.goaStore.get(sessionId);
            const effective = (0, host_bridge_1.coalescePageContext)(normalizedIncoming, base.lastPageContext);
            if (!normalizedIncoming) {
                return effective;
            }
            const next = Object.assign(Object.assign({}, base), { lastPageContext: normalizedIncoming, updatedAt: new Date().toISOString() });
            const saved = await this.goaStore.saveIfUnchanged(sessionId, next, base.updatedAt);
            if (saved) {
                return normalizedIncoming;
            }
        }
        const base = await this.goaStore.get(sessionId);
        return (0, host_bridge_1.coalescePageContext)(normalizedIncoming, base.lastPageContext);
    }
    async abandonActiveTask(sessionId) {
        try {
            const base = await this.goaStore.get(sessionId);
            await this.goaStore.save(sessionId, Object.assign(Object.assign({}, base), { activeTask: null }));
        }
        catch (error) {
            this.logger.warn(`abandon active task skipped sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getStoredPlan(payload) {
        var _a, _b;
        return (_b = (_a = payload.activeTask) === null || _a === void 0 ? void 0 : _a.plan) !== null && _b !== void 0 ? _b : null;
    }
};
SessionGoaService = SessionGoaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_goa_store_1.SessionGoaStore])
], SessionGoaService);
exports.SessionGoaService = SessionGoaService;
//# sourceMappingURL=session-goa.service.js.map