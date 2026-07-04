"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const message_feedback_dto_1 = require("./dto/message-feedback.dto");
const save_message_dto_1 = require("./dto/save-message.dto");
const save_message_response_dto_1 = require("./dto/save-message-response.dto");
const message_feedback_service_1 = require("./message-feedback.service");
const message_service_1 = require("./message.service");
let MessageController = class MessageController {
    constructor(service, feedbackService) {
        this.service = service;
        this.feedbackService = feedbackService;
    }
    userId(req) {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (id === undefined) {
            throw new common_1.UnauthorizedException('invalid user token');
        }
        return id;
    }
    appClientId(req) {
        var _a;
        const id = (_a = req.appClient) === null || _a === void 0 ? void 0 : _a.id;
        if (id === undefined) {
            throw new common_1.UnauthorizedException('missing app client context');
        }
        return id;
    }
    create(req, sessionId, body) {
        return this.service.create(this.userId(req), sessionId, body, this.appClientId(req));
    }
    listFeedbacks(req, sessionId, query) {
        return this.feedbackService.listForSessionMessages({
            sessionId,
            userId: this.userId(req),
            appClientId: this.appClientId(req),
            messageIds: this.feedbackService.parseMessageIdsParam(query.messageIds),
        });
    }
    upsertFeedback(req, sessionId, messageId, body) {
        return this.feedbackService.upsertForMessage({
            sessionId,
            messageId,
            userId: this.userId(req),
            appClientId: this.appClientId(req),
            dto: body,
        });
    }
    getFeedback(req, sessionId, messageId) {
        return this.feedbackService.findForMessage({
            sessionId,
            messageId,
            userId: this.userId(req),
            appClientId: this.appClientId(req),
        });
    }
    removeFeedback(req, sessionId, messageId) {
        return this.feedbackService.removeForMessage({
            sessionId,
            messageId,
            userId: this.userId(req),
            appClientId: this.appClientId(req),
        });
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '保存会话消息' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功', type: save_message_response_dto_1.SaveMessageResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, save_message_dto_1.SaveMessageDto]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('feedbacks'),
    (0, swagger_1.ApiOperation)({
        summary: '批量查询当前用户对会话内 assistant 消息的赞踩',
        description: 'query messageIds=1,2,3，最多 100 个',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, message_feedback_dto_1.QuerySessionMessageFeedbacksDto]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "listFeedbacks", null);
__decorate([
    (0, common_1.Put)(':messageId/feedback'),
    (0, swagger_1.ApiOperation)({
        summary: '对 assistant 消息点赞/点踩（幂等 upsert）',
        description: '点踩须 reasonTags 和/或 comment；选 other 标签时 comment 必填',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiParam)({ name: 'messageId', type: Number }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Param)('messageId', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, message_feedback_dto_1.UpsertMessageFeedbackDto]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "upsertFeedback", null);
__decorate([
    (0, common_1.Get)(':messageId/feedback'),
    (0, swagger_1.ApiOperation)({ summary: '查询当前用户对单条 assistant 消息的赞踩' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiParam)({ name: 'messageId', type: Number }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Param)('messageId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "getFeedback", null);
__decorate([
    (0, common_1.Delete)(':messageId/feedback'),
    (0, swagger_1.ApiOperation)({ summary: '取消对 assistant 消息的赞踩' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiParam)({ name: 'messageId', type: Number }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Param)('messageId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", void 0)
], MessageController.prototype, "removeFeedback", null);
MessageController = __decorate([
    (0, swagger_1.ApiTags)('message'),
    (0, common_1.Controller)('chat/:sessionId/messages'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    __metadata("design:paramtypes", [message_service_1.MessageService,
        message_feedback_service_1.MessageFeedbackService])
], MessageController);
exports.MessageController = MessageController;
//# sourceMappingURL=message.controller.js.map