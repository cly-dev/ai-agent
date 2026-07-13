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
var PromptRegistryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptRegistryService = void 0;
const common_1 = require("@nestjs/common");
const integration_site_util_1 = require("../../common/integration-site.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const ensure_global_prompt_templates_1 = require("./ensure-global-prompt-templates");
const prompt_defaults_1 = require("./prompt-defaults");
const prompt_template_keys_1 = require("./prompt-template.keys");
const prompt_template_render_util_1 = require("./prompt-template.render.util");
const prompt_template_store_1 = require("./prompt-template.store");
let PromptRegistryService = PromptRegistryService_1 = class PromptRegistryService {
    constructor(prisma, promptStore) {
        this.prisma = prisma;
        this.promptStore = promptStore;
        this.logger = new common_1.Logger(PromptRegistryService_1.name);
    }
    async onApplicationBootstrap() {
        try {
            const ensured = await (0, ensure_global_prompt_templates_1.ensureGlobalPromptTemplates)(this.prisma);
            if (ensured.created.length > 0) {
                this.logger.log(`prompt templates initialized in DB: ${ensured.created.join(', ')}`);
            }
            await this.reloadAllActiveFromDb();
        }
        catch (error) {
            this.logger.warn(`prompt registry bootstrap skipped: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async reloadAllActiveFromDb() {
        const rows = await this.prisma.promptTemplate.findMany({
            where: { isActive: true },
        });
        for (const row of rows) {
            await this.syncActiveRowToRedis(row);
        }
        this.logger.log(`prompt templates synced to redis: ${rows.length} active row(s)`);
    }
    async syncActiveRowToRedis(row) {
        if (!row.isActive) {
            await this.promptStore.delete(row.key, row.appClientId, row.agentId, row.locale);
            return;
        }
        const resolved = this.toResolved(row);
        await this.promptStore.set(row.key, row.appClientId, row.agentId, row.locale, resolved);
    }
    async render(key, scope = {}, variables = {}) {
        const resolved = await this.resolve(key, scope);
        const mergedVars = Object.assign({ usShopId: (0, integration_site_util_1.getDefaultXShopId)(), caShopId: (0, integration_site_util_1.getCanadaXShopId)(), defaultUsShopId: (0, integration_site_util_1.getDefaultXShopId)() }, variables);
        return (0, prompt_template_render_util_1.renderPromptTemplate)(resolved.content, mergedVars);
    }
    async resolve(key, scope = {}) {
        var _a;
        const locale = ((_a = scope.locale) === null || _a === void 0 ? void 0 : _a.trim()) || 'zh-CN';
        const resolved = await this.resolveFromRedis(key, scope, locale);
        if (resolved) {
            return resolved;
        }
        const row = await this.findActiveRow(key, scope.appClientId, scope.agentId, locale);
        if (row) {
            await this.syncActiveRowToRedis(row);
            return this.toResolved(row);
        }
        const fallback = this.resolveCodeFallback(key);
        if (fallback) {
            this.logger.debug(`prompt code fallback key=${key} (no active DB/Redis row)`);
            return fallback;
        }
        throw new Error(`prompt template not found: key=${key}`);
    }
    async resolveFromRedis(key, scope, locale) {
        if (!this.promptStore.isAvailable()) {
            return null;
        }
        const { appClientId, agentId } = scope;
        const candidates = [];
        if (agentId != null && appClientId != null) {
            candidates.push({ appClientId, agentId });
        }
        if (appClientId != null) {
            candidates.push({ appClientId, agentId: null });
        }
        candidates.push({ appClientId: null, agentId: null });
        for (const candidate of candidates) {
            const hit = await this.promptStore.get(key, candidate.appClientId, candidate.agentId, locale);
            if (hit) {
                return hit;
            }
        }
        return null;
    }
    async findActiveRow(key, appClientId, agentId, locale) {
        const scopes = [];
        if (agentId != null && appClientId != null) {
            scopes.push({ key, agentId, appClientId, locale, isActive: true });
        }
        if (appClientId != null) {
            scopes.push({ key, agentId: null, appClientId, locale, isActive: true });
        }
        scopes.push({ key, agentId: null, appClientId: null, locale, isActive: true });
        for (const where of scopes) {
            const row = await this.prisma.promptTemplate.findFirst({ where });
            if (row) {
                return row;
            }
        }
        return null;
    }
    toResolved(row) {
        return {
            key: row.key,
            version: row.version,
            content: row.content,
            scope: this.scopeLabel(row.agentId, row.appClientId),
            templateId: row.id,
        };
    }
    resolveCodeFallback(key) {
        if (!prompt_template_keys_1.PROMPT_KEY_LIST.includes(key)) {
            return null;
        }
        const content = prompt_defaults_1.PROMPT_DEFAULT_CONTENT[key];
        if (!content) {
            return null;
        }
        return {
            key,
            version: 0,
            content,
            scope: 'global',
            templateId: 0,
        };
    }
    scopeLabel(agentId, appClientId) {
        if (agentId != null) {
            return 'agent';
        }
        if (appClientId != null) {
            return 'app_client';
        }
        return 'global';
    }
};
PromptRegistryService = PromptRegistryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        prompt_template_store_1.PromptTemplateStore])
], PromptRegistryService);
exports.PromptRegistryService = PromptRegistryService;
//# sourceMappingURL=prompt-registry.service.js.map