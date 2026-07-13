"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectivityModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const llm_module_1 = require("../../core/llm/llm.module");
const memory_module_1 = require("../../core/memory/memory.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const connectivity_controller_1 = require("./connectivity.controller");
const connectivity_service_1 = require("./connectivity.service");
let ConnectivityModule = class ConnectivityModule {
};
ConnectivityModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, prisma_module_1.PrismaModule, memory_module_1.MemoryModule, llm_module_1.LlmModule],
        controllers: [connectivity_controller_1.ConnectivityController],
        providers: [connectivity_service_1.ConnectivityService],
        exports: [connectivity_service_1.ConnectivityService],
    })
], ConnectivityModule);
exports.ConnectivityModule = ConnectivityModule;
//# sourceMappingURL=connectivity.module.js.map