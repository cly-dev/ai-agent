"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAppModule = void 0;
const common_1 = require("@nestjs/common");
const agent_engine_module_1 = require("../core/agent-engine/agent-engine.module");
const chat_events_module_1 = require("../modules/chat/chat-events.module");
const session_run_module_1 = require("../core/session-run/session-run.module");
const agent_module_1 = require("../modules/agent/agent.module");
const host_tool_module_1 = require("../modules/host-tool/host-tool.module");
const skill_module_1 = require("../core/skill/skill.module");
const tool_engine_module_1 = require("../core/tool-engine/tool-engine.module");
const intent_module_1 = require("../core/intent/intent.module");
const shared_infra_module_1 = require("./shared-infra.module");
let WorkerAppModule = class WorkerAppModule {
};
WorkerAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_infra_module_1.SharedInfraModule,
            intent_module_1.IntentModule,
            skill_module_1.SkillModule,
            tool_engine_module_1.ToolEngineModule,
            agent_module_1.AgentModule,
            host_tool_module_1.HostToolModule,
            chat_events_module_1.ChatEventsModule,
            agent_engine_module_1.AgentEngineModule,
            session_run_module_1.SessionRunModule,
        ],
    })
], WorkerAppModule);
exports.WorkerAppModule = WorkerAppModule;
//# sourceMappingURL=worker-app.module.js.map