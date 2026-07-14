"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppClientModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const app_client_auth_service_1 = require("./auth/app-client-auth.service");
const app_client_service_1 = require("./app-client.service");
const app_client_controller_1 = require("./app-client.controller");
const user_module_1 = require("../user/user.module");
let AppClientModule = class AppClientModule {
};
AppClientModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, user_module_1.UserModule],
        providers: [app_client_service_1.AppClientService, app_client_auth_service_1.AppClientAuthService],
        controllers: [app_client_controller_1.AppClientController],
        exports: [app_client_service_1.AppClientService, app_client_auth_service_1.AppClientAuthService],
    })
], AppClientModule);
exports.AppClientModule = AppClientModule;
//# sourceMappingURL=app-client.module.js.map