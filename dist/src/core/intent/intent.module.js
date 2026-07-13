"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentModule = void 0;
const common_1 = require("@nestjs/common");
const llm_module_1 = require("../llm/llm.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const tool_engine_module_1 = require("../tool-engine/tool-engine.module");
const category_intent_recall_service_1 = require("./category-intent-recall.service");
const intent_recall_config_cache_store_1 = require("./intent-recall-config-cache.store");
const intent_recall_config_service_1 = require("./intent-recall-config.service");
const intent_scope_service_1 = require("./intent-scope.service");
let IntentModule = class IntentModule {
};
IntentModule = __decorate([
    (0, common_1.Module)({
        imports: [llm_module_1.LlmModule, prisma_module_1.PrismaModule, tool_engine_module_1.ToolEngineModule],
        providers: [
            intent_recall_config_cache_store_1.IntentRecallConfigCacheStore,
            intent_recall_config_service_1.IntentRecallConfigService,
            category_intent_recall_service_1.CategoryIntentRecallService,
            intent_scope_service_1.IntentScopeService,
        ],
        exports: [
            category_intent_recall_service_1.CategoryIntentRecallService,
            intent_recall_config_service_1.IntentRecallConfigService,
            intent_scope_service_1.IntentScopeService,
        ],
    })
], IntentModule);
exports.IntentModule = IntentModule;
//# sourceMappingURL=intent.module.js.map