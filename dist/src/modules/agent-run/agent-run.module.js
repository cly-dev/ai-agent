"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunModule = void 0;
const common_1 = require("@nestjs/common");
const agent_run_service_1 = require("./agent-run.service");
const agent_run_controller_1 = require("./agent-run.controller");
let AgentRunModule = class AgentRunModule {
};
AgentRunModule = __decorate([
    (0, common_1.Module)({
        providers: [agent_run_service_1.AgentRunService],
        controllers: [agent_run_controller_1.AgentRunController],
        exports: [agent_run_service_1.AgentRunService],
    })
], AgentRunModule);
exports.AgentRunModule = AgentRunModule;
//# sourceMappingURL=agent-run.module.js.map