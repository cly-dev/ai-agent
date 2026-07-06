"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedInfraModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const llm_module_1 = require("../core/llm/llm.module");
const memory_module_1 = require("../core/memory/memory.module");
const runtime_cache_module_1 = require("../core/runtime-cache/runtime-cache.module");
const prompt_module_1 = require("../core/prompt/prompt.module");
const prisma_module_1 = require("../prisma/prisma.module");
const auth_module_1 = require("../auth/auth.module");
const approval_module_1 = require("../core/approval/approval.module");
let SharedInfraModule = class SharedInfraModule {
};
SharedInfraModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot({
                ttl: 60,
                limit: 120,
            }),
            prisma_module_1.PrismaModule,
            memory_module_1.MemoryModule,
            llm_module_1.LlmModule,
            prompt_module_1.PromptModule,
            runtime_cache_module_1.RuntimeCacheModule,
            auth_module_1.AuthModule,
            approval_module_1.ApprovalModule,
        ],
        exports: [
            throttler_1.ThrottlerModule,
            prisma_module_1.PrismaModule,
            memory_module_1.MemoryModule,
            llm_module_1.LlmModule,
            prompt_module_1.PromptModule,
            runtime_cache_module_1.RuntimeCacheModule,
            auth_module_1.AuthModule,
            approval_module_1.ApprovalModule,
        ],
    })
], SharedInfraModule);
exports.SharedInfraModule = SharedInfraModule;
//# sourceMappingURL=shared-infra.module.js.map