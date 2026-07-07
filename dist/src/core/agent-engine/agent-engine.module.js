"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentEngineModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const llm_module_1 = require("../llm/llm.module");
const intent_module_1 = require("../intent/intent.module");
const skill_module_1 = require("../skill/skill.module");
const prompt_module_1 = require("../prompt/prompt.module");
const tool_engine_module_1 = require("../tool-engine/tool-engine.module");
const chat_module_1 = require("../../modules/chat/chat.module");
const chat_events_module_1 = require("../../modules/chat/chat-events.module");
const agent_module_1 = require("../../modules/agent/agent.module");
const host_tool_module_1 = require("../../modules/host-tool/host-tool.module");
const session_run_module_1 = require("../session-run/session-run.module");
const agent_engine_service_1 = require("./engine/agent-engine.service");
const agent_lang_graph_runner_1 = require("./engine/main/runner/agent-lang-graph.runner");
const agent_run_lifecycle_service_1 = require("./engine/main/run/agent-run-lifecycle.service");
const agent_run_sse_emitter_1 = require("./engine/main/run/agent-run-sse.emitter");
const run_assistant_artifact_store_1 = require("./engine/main/run/run-assistant-artifact.store");
const run_assistant_message_persist_service_1 = require("./engine/main/run/run-assistant-message-persist.service");
const agent_session_scope_service_1 = require("./engine/main/session/agent-session-scope.service");
const requested_skill_run_service_1 = require("./engine/main/skill/requested-skill-run.service");
let AgentEngineModule = class AgentEngineModule {
};
AgentEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            llm_module_1.LlmModule,
            intent_module_1.IntentModule,
            skill_module_1.SkillModule,
            prompt_module_1.PromptModule,
            tool_engine_module_1.ToolEngineModule,
            (0, common_1.forwardRef)(() => agent_module_1.AgentModule),
            (0, common_1.forwardRef)(() => chat_module_1.ChatModule),
            chat_events_module_1.ChatEventsModule,
            (0, common_1.forwardRef)(() => session_run_module_1.SessionRunModule),
            host_tool_module_1.HostToolModule,
        ],
        providers: [
            run_assistant_artifact_store_1.RunAssistantArtifactStore,
            run_assistant_message_persist_service_1.RunAssistantMessagePersistService,
            agent_run_sse_emitter_1.AgentRunSseEmitter,
            agent_session_scope_service_1.AgentSessionScopeService,
            agent_run_lifecycle_service_1.AgentRunLifecycleService,
            requested_skill_run_service_1.RequestedSkillRunService,
            agent_lang_graph_runner_1.AgentLangGraphRunner,
            agent_engine_service_1.AgentEngineService,
        ],
        exports: [
            agent_engine_service_1.AgentEngineService,
            agent_session_scope_service_1.AgentSessionScopeService,
        ],
    })
], AgentEngineModule);
exports.AgentEngineModule = AgentEngineModule;
//# sourceMappingURL=agent-engine.module.js.map