"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationModule = void 0;
const common_1 = require("@nestjs/common");
const outbound_http_module_1 = require("../../core/outbound-http/outbound-http.module");
const auth_module_1 = require("../../auth/auth.module");
const integration_controller_1 = require("./integration.controller");
const integration_service_1 = require("./integration.service");
let IntegrationModule = class IntegrationModule {
};
IntegrationModule = __decorate([
    (0, common_1.Module)({
        imports: [outbound_http_module_1.OutboundHttpModule, auth_module_1.AuthModule],
        providers: [integration_service_1.IntegrationService],
        controllers: [integration_controller_1.IntegrationController],
        exports: [integration_service_1.IntegrationService],
    })
], IntegrationModule);
exports.IntegrationModule = IntegrationModule;
//# sourceMappingURL=integration.module.js.map