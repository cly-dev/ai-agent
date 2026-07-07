"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const prompt_composer_service_1 = require("./prompt-composer.service");
const prompt_registry_service_1 = require("./prompt-registry.service");
const prompt_template_store_1 = require("./prompt-template.store");
let PromptModule = class PromptModule {
};
PromptModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [prompt_template_store_1.PromptTemplateStore, prompt_registry_service_1.PromptRegistryService, prompt_composer_service_1.PromptComposerService],
        exports: [prompt_template_store_1.PromptTemplateStore, prompt_registry_service_1.PromptRegistryService, prompt_composer_service_1.PromptComposerService],
    })
], PromptModule);
exports.PromptModule = PromptModule;
//# sourceMappingURL=prompt.module.js.map