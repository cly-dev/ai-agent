"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostToolModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const auth_module_1 = require("../../auth/auth.module");
const workflow_module_1 = require("../workflow/workflow.module");
const host_tool_controller_1 = require("./host-tool.controller");
const host_tool_service_1 = require("./host-tool.service");
let HostToolModule = class HostToolModule {
};
HostToolModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, workflow_module_1.WorkflowModule],
        controllers: [host_tool_controller_1.HostToolController],
        providers: [host_tool_service_1.HostToolService],
        exports: [host_tool_service_1.HostToolService],
    })
], HostToolModule);
exports.HostToolModule = HostToolModule;
//# sourceMappingURL=host-tool.module.js.map