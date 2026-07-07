"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFeedbackModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../prisma/prisma.module");
const message_feedback_admin_controller_1 = require("./message-feedback-admin.controller");
const message_feedback_admin_service_1 = require("./message-feedback-admin.service");
let MessageFeedbackModule = class MessageFeedbackModule {
};
MessageFeedbackModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [message_feedback_admin_service_1.MessageFeedbackAdminService],
        controllers: [message_feedback_admin_controller_1.MessageFeedbackAdminController],
        exports: [message_feedback_admin_service_1.MessageFeedbackAdminService],
    })
], MessageFeedbackModule);
exports.MessageFeedbackModule = MessageFeedbackModule;
//# sourceMappingURL=message-feedback.module.js.map