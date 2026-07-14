"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageAgentModule = void 0;
const common_1 = require("@nestjs/common");
const outbound_http_module_1 = require("../../core/outbound-http/outbound-http.module");
const auth_module_1 = require("../../auth/auth.module");
const llm_module_1 = require("../../core/llm/llm.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const page_agent_controller_1 = require("./page-agent.controller");
const page_agent_proxy_service_1 = require("./page-agent-proxy.service");
let PageAgentModule = class PageAgentModule {
};
PageAgentModule = __decorate([
    (0, common_1.Module)({
        imports: [outbound_http_module_1.OutboundHttpModule, prisma_module_1.PrismaModule, auth_module_1.AuthModule, llm_module_1.LlmModule],
        controllers: [page_agent_controller_1.PageAgentController],
        providers: [page_agent_proxy_service_1.PageAgentProxyService],
        exports: [page_agent_proxy_service_1.PageAgentProxyService],
    })
], PageAgentModule);
exports.PageAgentModule = PageAgentModule;
//# sourceMappingURL=page-agent.module.js.map