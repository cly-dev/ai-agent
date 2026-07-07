"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const prompt_module_1 = require("../../core/prompt/prompt.module");
const runtime_cache_module_1 = require("../../core/runtime-cache/runtime-cache.module");
const session_run_module_1 = require("../../core/session-run/session-run.module");
const skill_module_1 = require("../../core/skill/skill.module");
const agent_module_1 = require("../agent/agent.module");
const message_module_1 = require("../message/message.module");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const session_prepare_service_1 = require("./session-prepare.service");
const session_prepare_store_1 = require("./session-prepare.store");
const session_runtime_resolver_service_1 = require("./session-runtime-resolver.service");
const session_runtime_cache_hooks_service_1 = require("./session-runtime-cache-hooks.service");
const chat_events_module_1 = require("./chat-events.module");
const chat_session_run_bridge_module_1 = require("./chat-session-run-bridge.module");
const agent_auto_select_service_1 = require("./agent-auto-select.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let ChatModule = class ChatModule {
};
ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            runtime_cache_module_1.RuntimeCacheModule,
            chat_events_module_1.ChatEventsModule,
            chat_session_run_bridge_module_1.ChatSessionRunBridgeModule,
            (0, common_1.forwardRef)(() => agent_module_1.AgentModule),
            skill_module_1.SkillModule,
            prompt_module_1.PromptModule,
            (0, common_1.forwardRef)(() => message_module_1.MessageModule),
            (0, common_1.forwardRef)(() => session_run_module_1.SessionRunModule),
        ],
        providers: [
            chat_service_1.ChatService,
            session_prepare_store_1.SessionPrepareStore,
            session_runtime_resolver_service_1.SessionRuntimeResolverService,
            session_prepare_service_1.SessionPrepareService,
            session_runtime_cache_hooks_service_1.SessionRuntimeCacheHooksService,
            {
                provide: agent_auto_select_service_1.AgentAutoSelectService,
                useFactory: (prisma) => new agent_auto_select_service_1.AgentAutoSelectService(prisma),
                inject: [prisma_service_1.PrismaService],
            },
        ],
        controllers: [chat_controller_1.ChatController],
        exports: [
            chat_service_1.ChatService,
            chat_events_module_1.ChatEventsModule,
            chat_session_run_bridge_module_1.ChatSessionRunBridgeModule,
            session_prepare_store_1.SessionPrepareStore,
            session_prepare_service_1.SessionPrepareService,
            session_runtime_resolver_service_1.SessionRuntimeResolverService,
        ],
    })
], ChatModule);
exports.ChatModule = ChatModule;
//# sourceMappingURL=chat.module.js.map