"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunScopeCacheService = void 0;
const common_1 = require("@nestjs/common");
const runtime_cache_constants_1 = require("./runtime-cache.constants");
let RunScopeCacheService = class RunScopeCacheService {
    constructor() {
        this.hostToolsByRun = new Map();
        this.intentScopedBySession = new Map();
    }
    getHostToolsForRun(runId, pageScope, skillId) {
        const key = this.hostToolKey(runId, pageScope, skillId);
        const entry = this.hostToolsByRun.get(key);
        if (!entry || entry.expiresAt <= Date.now()) {
            if (entry) {
                this.hostToolsByRun.delete(key);
            }
            return null;
        }
        return entry.tools;
    }
    setHostToolsForRun(runId, pageScope, skillId, tools) {
        const key = this.hostToolKey(runId, pageScope, skillId);
        this.hostToolsByRun.set(key, {
            tools,
            expiresAt: Date.now() + (0, runtime_cache_constants_1.getRunScopeCacheTtlMs)(),
        });
        this.pruneHostTools();
    }
    clearHostToolsForRun(runId) {
        const prefix = `${runId}:`;
        for (const key of this.hostToolsByRun.keys()) {
            if (key.startsWith(prefix)) {
                this.hostToolsByRun.delete(key);
            }
        }
    }
    getIntentScoped(cacheKey, toolFingerprint) {
        const entry = this.intentScopedBySession.get(cacheKey);
        if (!entry || entry.expiresAt <= Date.now()) {
            if (entry) {
                this.intentScopedBySession.delete(cacheKey);
            }
            return null;
        }
        if (entry.toolFingerprint !== toolFingerprint) {
            this.intentScopedBySession.delete(cacheKey);
            return null;
        }
        return entry;
    }
    setIntentScoped(cacheKey, toolFingerprint, value) {
        this.intentScopedBySession.set(cacheKey, Object.assign(Object.assign({}, value), { toolFingerprint, expiresAt: Date.now() + (0, runtime_cache_constants_1.getRunScopeCacheTtlMs)() }));
        this.pruneIntent();
    }
    clearForSession(sessionId) {
        const marker = `${sessionId}:`;
        for (const key of this.intentScopedBySession.keys()) {
            if (key.startsWith(marker)) {
                this.intentScopedBySession.delete(key);
            }
        }
    }
    clearIntentReferencingToolIds(toolIds) {
        if (toolIds.length === 0) {
            return;
        }
        const idSet = new Set(toolIds);
        for (const [key, entry] of this.intentScopedBySession) {
            if (entry.scopedTools.some((tool) => idSet.has(tool.id))) {
                this.intentScopedBySession.delete(key);
            }
        }
    }
    clearAllIntent() {
        this.intentScopedBySession.clear();
    }
    hostToolKey(runId, pageScope, skillId) {
        return `${runId}:${pageScope.trim()}:${skillId !== null && skillId !== void 0 ? skillId : 'none'}`;
    }
    pruneHostTools() {
        const now = Date.now();
        for (const [key, entry] of this.hostToolsByRun) {
            if (entry.expiresAt <= now) {
                this.hostToolsByRun.delete(key);
            }
        }
        while (this.hostToolsByRun.size > runtime_cache_constants_1.MAX_RUN_SCOPE_CACHE_ENTRIES) {
            const first = this.hostToolsByRun.keys().next().value;
            if (first === undefined) {
                break;
            }
            this.hostToolsByRun.delete(first);
        }
    }
    pruneIntent() {
        const now = Date.now();
        for (const [key, entry] of this.intentScopedBySession) {
            if (entry.expiresAt <= now) {
                this.intentScopedBySession.delete(key);
            }
        }
        while (this.intentScopedBySession.size > runtime_cache_constants_1.MAX_RUN_SCOPE_CACHE_ENTRIES) {
            const first = this.intentScopedBySession.keys().next().value;
            if (first === undefined) {
                break;
            }
            this.intentScopedBySession.delete(first);
        }
    }
};
RunScopeCacheService = __decorate([
    (0, common_1.Injectable)()
], RunScopeCacheService);
exports.RunScopeCacheService = RunScopeCacheService;
//# sourceMappingURL=run-scope-cache.service.js.map