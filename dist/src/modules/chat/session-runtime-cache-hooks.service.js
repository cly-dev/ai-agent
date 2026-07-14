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
exports.SessionRuntimeCacheHooksService = void 0;
const common_1 = require("@nestjs/common");
const runtime_cache_invalidator_service_1 = require("../../core/runtime-cache/runtime-cache-invalidator.service");
const session_prepare_store_1 = require("./session-prepare.store");
let SessionRuntimeCacheHooksService = class SessionRuntimeCacheHooksService {
    constructor(invalidator, sessionPrepareStore) {
        this.invalidator = invalidator;
        this.sessionPrepareStore = sessionPrepareStore;
    }
    onModuleInit() {
        this.invalidator.registerSessionRuntimeHooks({
            invalidateSnapshotsForAgent: (agentId) => this.sessionPrepareStore.invalidateSnapshotsForAgent(agentId),
            invalidateSnapshotsContainingToolIds: (toolIds) => this.sessionPrepareStore.invalidateSnapshotsContainingToolIds(toolIds),
            deleteSession: (sessionId) => this.sessionPrepareStore.delete(sessionId),
        });
    }
};
SessionRuntimeCacheHooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [runtime_cache_invalidator_service_1.RuntimeCacheInvalidator,
        session_prepare_store_1.SessionPrepareStore])
], SessionRuntimeCacheHooksService);
exports.SessionRuntimeCacheHooksService = SessionRuntimeCacheHooksService;
//# sourceMappingURL=session-runtime-cache-hooks.service.js.map