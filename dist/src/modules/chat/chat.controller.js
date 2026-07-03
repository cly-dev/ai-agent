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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const chat_events_service_1 = require("./chat-events.service");
const chat_sse_payload_util_1 = require("./chat-sse-payload.util");
const chat_service_1 = require("./chat.service");
const create_chat_dto_1 = require("./dto/create-chat.dto");
const delete_chat_response_dto_1 = require("./dto/delete-chat-response.dto");
const cancel_agent_run_dto_1 = require("./dto/cancel-agent-run.dto");
const session_run_state_dto_1 = require("./dto/session-run-state.dto");
const prepare_chat_dto_1 = require("./dto/prepare-chat.dto");
const prepare_chat_response_dto_1 = require("./dto/prepare-chat-response.dto");
const query_chat_list_dto_1 = require("./dto/query-chat-list.dto");
const session_prepare_service_1 = require("./session-prepare.service");
const message_feedback_constants_1 = require("../message/message-feedback.constants");
let ChatController = class ChatController {
    constructor(chatService, chatEvents, sessionPrepareService) {
        this.chatService = chatService;
        this.chatEvents = chatEvents;
        this.sessionPrepareService = sessionPrepareService;
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
    normalizeSessionId(sessionId) {
        return sessionId.trim().toLowerCase();
    }
    create(req, body) {
        return this.chatService.create(this.userId(req), this.appClientId(req), body);
    }
    listMessageFeedbackDownReasonTags() {
        return { items: [...message_feedback_constants_1.MESSAGE_FEEDBACK_DOWN_REASON_TAGS] };
    }
    findAll(req, query) {
        return this.chatService.findAllForUser(this.userId(req), this.appClientId(req), query);
    }
    prepare(req, sessionId, body) {
        return this.sessionPrepareService.warm(this.normalizeSessionId(sessionId), this.userId(req), this.appClientId(req), this.sessionPrepareService.resolvePageContextFromPrepareDto(body));
    }
    findOne(req, sessionId, query) {
        return this.chatService.findOneForUser(this.normalizeSessionId(sessionId), this.userId(req), this.appClientId(req), query);
    }
    remove(req, sessionId) {
        return this.chatService.remove(this.normalizeSessionId(sessionId), this.userId(req), this.appClientId(req));
    }
    getRunState(req, sessionId) {
        return this.chatService.getSessionRunState(this.normalizeSessionId(sessionId), this.userId(req), this.appClientId(req));
    }
    cancelRun(req, sessionId, body) {
        return this.chatService.cancelSessionRun(this.normalizeSessionId(sessionId), this.userId(req), this.appClientId(req), body.runId);
    }
    stream(req, sessionId) {
        const uid = this.userId(req);
        const aid = this.appClientId(req);
        const normalizedSessionId = this.normalizeSessionId(sessionId);
        return new rxjs_1.Observable((subscriber) => {
            let inner = null;
            void this.chatService
                .assertSessionOwnedByUser(normalizedSessionId, uid, aid)
                .then((session) => {
                this.sessionPrepareService.warmInBackground(session.id, uid, aid);
                inner = this.chatEvents.observeSession(session.id, uid).subscribe({
                    next: (evt) => {
                        subscriber.next({
                            type: evt.event,
                            data: (0, chat_sse_payload_util_1.serializeChatSseData)(evt),
                        });
                    },
                    error: (err) => subscriber.error(err),
                    complete: () => subscriber.complete(),
                });
            })
                .catch((err) => subscriber.error(err));
            return () => {
                inner === null || inner === void 0 ? void 0 : inner.unsubscribe();
            };
        });
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建会话并保存第一条消息，返回 sessionId' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_chat_dto_1.CreateChatDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('feedback/down-reason-tags'),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：点踩原因标签列表',
        description: '供点踩弹窗渲染；提交 upsert 时传 key 数组',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listMessageFeedbackDownReasonTags", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '当前用户在当前 DSN 对应 AppClient 下的会话列表（分页）',
        description: '查询参数 page（默认 1）、size（默认 20，最大 100）。返回 items / total / page / pageSize / totalPages。',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_chat_list_dto_1.QueryChatListDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':sessionId/prepare'),
    (0, swagger_1.ApiOperation)({
        summary: '预热会话：Agent runtime、权限内 tools/skills、按路由 page 预热 host_tool、会话 history',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String, description: '会话 ID（32 位 hex）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '预热完成', type: prepare_chat_response_dto_1.PrepareChatResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, prepare_chat_dto_1.PrepareChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "prepare", null);
__decorate([
    (0, common_1.Get)(':sessionId'),
    (0, swagger_1.ApiOperation)({
        summary: '按 sessionId 获取会话详情（消息分页）',
        description: '查询参数 page（默认 1）、size（默认 20，最大 100）。messages 为分页对象；page=1 为最新一页，items 内按时间升序。',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, query_chat_list_dto_1.QueryChatListDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':sessionId'),
    (0, swagger_1.ApiOperation)({ summary: 'C 端删除会话（含消息、运行记录及会话上下文）' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String, description: '会话 ID（32 位 hex）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功', type: delete_chat_response_dto_1.DeleteChatResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':sessionId/run-state'),
    (0, swagger_1.ApiOperation)({
        summary: '获取 session run 状态（generation / active run / pendingWriteGate，用于多 Tab 与页面刷新对齐）',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: session_run_state_dto_1.SessionRunStateResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRunState", null);
__decorate([
    (0, common_1.Post)(':sessionId/cancel-run'),
    (0, swagger_1.ApiOperation)({
        summary: '停止当前 session 正在执行的 Agent Run（并清空排队任务）',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, type: cancel_agent_run_dto_1.CancelAgentRunResponseDto }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cancel_agent_run_dto_1.CancelAgentRunDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "cancelRun", null);
__decorate([
    (0, throttler_1.SkipThrottle)(),
    (0, common_1.Sse)(':sessionId/stream'),
    (0, swagger_1.ApiOperation)({
        summary: 'SSE：think-思考 / message-结果和信息 / complete-推送完成 / error-推送失败',
    }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', type: String, description: '会话 ID（hex）' }),
    (0, swagger_1.ApiProduces)('text/event-stream'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], ChatController.prototype, "stream", null);
ChatController = __decorate([
    (0, swagger_1.ApiTags)('chat'),
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_events_service_1.ChatEventsService,
        session_prepare_service_1.SessionPrepareService])
], ChatController);
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map