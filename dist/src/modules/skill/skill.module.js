"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillModule = void 0;
const common_1 = require("@nestjs/common");
const skill_module_1 = require("../../core/skill/skill.module");
const runtime_cache_module_1 = require("../../core/runtime-cache/runtime-cache.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const agent_module_1 = require("../agent/agent.module");
const workflow_module_1 = require("../workflow/workflow.module");
const skill_service_1 = require("./skill.service");
const skill_controller_1 = require("./skill.controller");
let SkillModule = class SkillModule {
};
SkillModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            skill_module_1.SkillModule,
            runtime_cache_module_1.RuntimeCacheModule,
            workflow_module_1.WorkflowModule,
            (0, common_1.forwardRef)(() => agent_module_1.AgentModule),
        ],
        providers: [skill_service_1.SkillService],
        controllers: [skill_controller_1.SkillController],
        exports: [skill_service_1.SkillService],
    })
], SkillModule);
exports.SkillModule = SkillModule;
//# sourceMappingURL=skill.module.js.map