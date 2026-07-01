"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageActionModule = void 0;
const common_1 = require("@nestjs/common");
const llm_module_1 = require("../../core/llm/llm.module");
const tool_engine_module_1 = require("../../core/tool-engine/tool-engine.module");
const approval_module_1 = require("../../core/approval/approval.module");
const auth_module_1 = require("../../auth/auth.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const workflow_module_1 = require("../workflow/workflow.module");
const page_action_controller_1 = require("./page-action.controller");
const page_action_service_1 = require("./page-action.service");
let PageActionModule = class PageActionModule {
};
PageActionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            llm_module_1.LlmModule,
            tool_engine_module_1.ToolEngineModule,
            workflow_module_1.WorkflowModule,
            approval_module_1.ApprovalModule,
        ],
        controllers: [page_action_controller_1.PageActionController],
        providers: [page_action_service_1.PageActionService],
        exports: [page_action_service_1.PageActionService],
    })
], PageActionModule);
exports.PageActionModule = PageActionModule;
//# sourceMappingURL=page-action.module.js.map