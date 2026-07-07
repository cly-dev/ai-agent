"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageActionExecutionModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../../prisma/prisma.module");
const llm_module_1 = require("../../llm/llm.module");
const tool_engine_module_1 = require("../../tool-engine/tool-engine.module");
const approval_module_1 = require("../../approval/approval.module");
const page_action_stream_module_1 = require("../stream/page-action-stream.module");
const page_action_run_executor_1 = require("./page-action-run.executor");
let PageActionExecutionModule = class PageActionExecutionModule {
};
PageActionExecutionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            llm_module_1.LlmModule,
            tool_engine_module_1.ToolEngineModule,
            approval_module_1.ApprovalModule,
            page_action_stream_module_1.PageActionStreamModule,
        ],
        providers: [page_action_run_executor_1.PageActionRunExecutor],
        exports: [page_action_run_executor_1.PageActionRunExecutor],
    })
], PageActionExecutionModule);
exports.PageActionExecutionModule = PageActionExecutionModule;
//# sourceMappingURL=page-action-execution.module.js.map