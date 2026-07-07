"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const runtime_cache_module_1 = require("../runtime-cache/runtime-cache.module");
const llm_module_1 = require("../llm/llm.module");
const tool_engine_module_1 = require("../tool-engine/tool-engine.module");
const page_action_stream_module_1 = require("../page-action/stream/page-action-stream.module");
const approval_gate_service_1 = require("./approval-gate.service");
const approval_request_service_1 = require("./approval-request.service");
const approval_resume_service_1 = require("./approval-resume.service");
const approval_trigger_permission_service_1 = require("./approval-trigger-permission.service");
let ApprovalModule = class ApprovalModule {
};
ApprovalModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            runtime_cache_module_1.RuntimeCacheModule,
            llm_module_1.LlmModule,
            tool_engine_module_1.ToolEngineModule,
            page_action_stream_module_1.PageActionStreamModule,
        ],
        providers: [
            approval_request_service_1.ApprovalRequestService,
            approval_gate_service_1.ApprovalGateService,
            approval_trigger_permission_service_1.ApprovalTriggerPermissionService,
            approval_resume_service_1.ApprovalResumeService,
        ],
        exports: [
            approval_request_service_1.ApprovalRequestService,
            approval_gate_service_1.ApprovalGateService,
            approval_trigger_permission_service_1.ApprovalTriggerPermissionService,
            approval_resume_service_1.ApprovalResumeService,
        ],
    })
], ApprovalModule);
exports.ApprovalModule = ApprovalModule;
//# sourceMappingURL=approval.module.js.map