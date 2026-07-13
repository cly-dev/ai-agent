"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptTemplateModule = void 0;
const common_1 = require("@nestjs/common");
const prompt_module_1 = require("../../core/prompt/prompt.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const prompt_template_controller_1 = require("./prompt-template.controller");
const prompt_template_service_1 = require("./prompt-template.service");
let PromptTemplateModule = class PromptTemplateModule {
};
PromptTemplateModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, prompt_module_1.PromptModule],
        controllers: [prompt_template_controller_1.PromptTemplateController],
        providers: [prompt_template_service_1.PromptTemplateService],
        exports: [prompt_template_service_1.PromptTemplateService],
    })
], PromptTemplateModule);
exports.PromptTemplateModule = PromptTemplateModule;
//# sourceMappingURL=prompt-template.module.js.map