"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmModelConfigModule = void 0;
const common_1 = require("@nestjs/common");
const intent_module_1 = require("../../core/intent/intent.module");
const llm_module_1 = require("../../core/llm/llm.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const llm_model_config_controller_1 = require("./llm-model-config.controller");
const llm_model_config_service_1 = require("./llm-model-config.service");
let LlmModelConfigModule = class LlmModelConfigModule {
};
LlmModelConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, llm_module_1.LlmModule, intent_module_1.IntentModule],
        providers: [llm_model_config_service_1.LlmModelConfigService],
        controllers: [llm_model_config_controller_1.LlmModelConfigController],
        exports: [llm_model_config_service_1.LlmModelConfigService],
    })
], LlmModelConfigModule);
exports.LlmModelConfigModule = LlmModelConfigModule;
//# sourceMappingURL=llm-model-config.module.js.map