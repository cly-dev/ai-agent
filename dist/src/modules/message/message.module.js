"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const agent_engine_module_1 = require("../../core/agent-engine/agent-engine.module");
const session_run_module_1 = require("../../core/session-run/session-run.module");
const chat_module_1 = require("../chat/chat.module");
const message_controller_1 = require("./message.controller");
const message_feedback_service_1 = require("./message-feedback.service");
const message_service_1 = require("./message.service");
let MessageModule = class MessageModule {
};
MessageModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            (0, common_1.forwardRef)(() => chat_module_1.ChatModule),
            agent_engine_module_1.AgentEngineModule,
            session_run_module_1.SessionRunModule,
        ],
        providers: [message_service_1.MessageService, message_feedback_service_1.MessageFeedbackService],
        controllers: [message_controller_1.MessageController],
        exports: [message_service_1.MessageService],
    })
], MessageModule);
exports.MessageModule = MessageModule;
//# sourceMappingURL=message.module.js.map