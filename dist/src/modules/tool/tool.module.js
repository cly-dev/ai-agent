"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const agent_engine_module_1 = require("../../core/agent-engine/agent-engine.module");
const llm_module_1 = require("../../core/llm/llm.module");
const prompt_module_1 = require("../../core/prompt/prompt.module");
const tool_engine_module_1 = require("../../core/tool-engine/tool-engine.module");
const tool_controller_1 = require("./tool.controller");
const tool_service_1 = require("./tool.service");
let ToolModule = class ToolModule {
};
ToolModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            llm_module_1.LlmModule,
            prompt_module_1.PromptModule,
            tool_engine_module_1.ToolEngineModule,
            (0, common_1.forwardRef)(() => agent_engine_module_1.AgentEngineModule),
        ],
        providers: [tool_service_1.ToolService],
        controllers: [tool_controller_1.ToolController],
        exports: [tool_service_1.ToolService],
    })
], ToolModule);
exports.ToolModule = ToolModule;
//# sourceMappingURL=tool.module.js.map