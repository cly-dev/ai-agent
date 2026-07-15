"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
require("./core/env/load-env");
const admin_prefix_jwt_guard_1 = require("./auth/admin-prefix-jwt.guard");
const admin_role_guard_1 = require("./auth/admin-role.guard");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const outbound_http_module_1 = require("./core/outbound-http/outbound-http.module");
const image_panel_module_1 = require("./core/image-panel/image-panel.module");
const llm_module_1 = require("./core/llm/llm.module");
const memory_module_1 = require("./core/memory/memory.module");
const runtime_cache_module_1 = require("./core/runtime-cache/runtime-cache.module");
const prompt_module_1 = require("./core/prompt/prompt.module");
const prisma_module_1 = require("./prisma/prisma.module");
const admin_user_module_1 = require("./modules/admin-user/admin-user.module");
const agent_module_1 = require("./modules/agent/agent.module");
const app_client_module_1 = require("./modules/app-client/app-client.module");
const integration_module_1 = require("./modules/integration/integration.module");
const chat_module_1 = require("./modules/chat/chat.module");
const message_feedback_module_1 = require("./modules/message-feedback/message-feedback.module");
const message_module_1 = require("./modules/message/message.module");
const skill_module_1 = require("./modules/skill/skill.module");
const tool_module_1 = require("./modules/tool/tool.module");
const message_turn_module_1 = require("./modules/message-turn/message-turn.module");
const agent_run_module_1 = require("./modules/agent-run/agent-run.module");
const user_module_1 = require("./modules/user/user.module");
const user_app_module_1 = require("./modules/user-app/user-app.module");
const auth_module_1 = require("./auth/auth.module");
const session_module_1 = require("./modules/session/session.module");
const tool_category_module_1 = require("./modules/tool-category/tool-category.module");
const llm_model_config_module_1 = require("./modules/llm-model-config/llm-model-config.module");
const prompt_template_module_1 = require("./modules/prompt-template/prompt-template.module");
const role_module_1 = require("./modules/role/role.module");
const host_tool_module_1 = require("./modules/host-tool/host-tool.module");
const page_action_module_1 = require("./modules/page-action/page-action.module");
const page_agent_module_1 = require("./modules/page-agent/page-agent.module");
const approval_module_1 = require("./core/approval/approval.module");
const approval_module_2 = require("./modules/approval/approval.module");
const workflow_module_1 = require("./modules/workflow/workflow.module");
const connectivity_module_1 = require("./modules/connectivity/connectivity.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot({
                ttl: 60,
                limit: 120,
            }),
            outbound_http_module_1.OutboundHttpModule,
            image_panel_module_1.ImagePanelModule,
            llm_module_1.LlmModule,
            memory_module_1.MemoryModule,
            runtime_cache_module_1.RuntimeCacheModule,
            prompt_module_1.PromptModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            admin_user_module_1.AdminUserModule,
            app_client_module_1.AppClientModule,
            user_module_1.UserModule,
            user_app_module_1.UserAppModule,
            session_module_1.SessionModule,
            tool_category_module_1.ToolCategoryModule,
            llm_model_config_module_1.LlmModelConfigModule,
            prompt_template_module_1.PromptTemplateModule,
            role_module_1.RoleModule,
            host_tool_module_1.HostToolModule,
            page_action_module_1.PageActionModule,
            page_agent_module_1.PageAgentModule,
            approval_module_1.ApprovalModule,
            approval_module_2.ApprovalModule,
            workflow_module_1.WorkflowModule,
            agent_module_1.AgentModule,
            chat_module_1.ChatModule,
            message_module_1.MessageModule,
            message_feedback_module_1.MessageFeedbackModule,
            tool_module_1.ToolModule,
            message_turn_module_1.MessageTurnModule,
            agent_run_module_1.AgentRunModule,
            skill_module_1.SkillModule,
            integration_module_1.IntegrationModule,
            connectivity_module_1.ConnectivityModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: admin_prefix_jwt_guard_1.AdminPrefixJwtGuard },
            { provide: core_1.APP_GUARD, useClass: admin_role_guard_1.AdminRoleGuard },
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map