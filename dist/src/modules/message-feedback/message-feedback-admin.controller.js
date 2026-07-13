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
exports.MessageFeedbackAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const query_message_feedback_admin_dto_1 = require("./dto/query-message-feedback-admin.dto");
const message_feedback_admin_service_1 = require("./message-feedback-admin.service");
let MessageFeedbackAdminController = class MessageFeedbackAdminController {
    constructor(service) {
        this.service = service;
    }
    listDownReasonTags() {
        return this.service.listDownReasonTags();
    }
    getSummary(appClientId, days) {
        const parsedDays = days == null || days.trim() === '' ? 7 : Math.max(1, Number(days));
        return this.service.getSummary(appClientId, parsedDays);
    }
    findPageBySession(appClientId, sessionId, query) {
        return this.service.findPageBySession(appClientId, sessionId, query);
    }
    findPage(appClientId, query) {
        return this.service.findPage(appClientId, query);
    }
    findOne(appClientId, id) {
        return this.service.findOne(appClientId, id);
    }
};
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId/down-reason-tags'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '点踩原因标签字典（与 C 端一致）' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MessageFeedbackAdminController.prototype, "listDownReasonTags", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId/summary'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '赞踩汇总（近 N 天）' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], MessageFeedbackAdminController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId/by-session/:sessionId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiOperation)({ summary: '按 Session 分页查询反馈' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, query_message_feedback_admin_dto_1.QueryMessageFeedbackAdminDto]),
    __metadata("design:returntype", void 0)
], MessageFeedbackAdminController.prototype, "findPageBySession", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 AppClient 分页查询消息赞踩' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_message_feedback_admin_dto_1.QueryMessageFeedbackAdminDto]),
    __metadata("design:returntype", void 0)
], MessageFeedbackAdminController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '反馈详情' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], MessageFeedbackAdminController.prototype, "findOne", null);
MessageFeedbackAdminController = __decorate([
    (0, swagger_1.ApiTags)('message-feedback'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('message-feedback'),
    __metadata("design:paramtypes", [message_feedback_admin_service_1.MessageFeedbackAdminService])
], MessageFeedbackAdminController);
exports.MessageFeedbackAdminController = MessageFeedbackAdminController;
//# sourceMappingURL=message-feedback-admin.controller.js.map