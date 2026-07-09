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
exports.PageActionCEndController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../../auth/app-client-dsn.constants");
const user_jwt_auth_guard_1 = require("../../../auth/user-jwt-auth.guard");
const query_automation_task_dto_1 = require("../../automation/dto/query-automation-task.dto");
const page_action_dto_1 = require("../dto/page-action.dto");
const page_action_c_end_service_1 = require("./page-action-c-end.service");
let PageActionCEndController = class PageActionCEndController {
    constructor(cEndService) {
        this.cEndService = cEndService;
    }
    appClientId(req) {
        var _a;
        const id = (_a = req.appClient) === null || _a === void 0 ? void 0 : _a.id;
        if (id === undefined) {
            throw new common_1.UnauthorizedException('missing app client context');
        }
        return id;
    }
    userId(req) {
        var _a;
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (id === undefined) {
            throw new common_1.UnauthorizedException('invalid user token');
        }
        return id;
    }
    async invoke(req, body) {
        return this.cEndService.invoke(this.userId(req), this.appClientId(req), body);
    }
    async streamRun(req, id, res) {
        await this.cEndService.subscribeRunStream(this.userId(req), this.appClientId(req), id, res);
    }
    listRuns(req, query) {
        return this.cEndService.listRuns(this.userId(req), this.appClientId(req), query);
    }
};
__decorate([
    (0, common_1.Post)('page-action/invoke'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：提交 PageAction 自动化',
        description: '立即返回 runId 与 streamUrl；执行在后台进行。订阅 GET /page-action/runs/:id/stream 查看过程。',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, page_action_dto_1.InvokePageActionDto]),
    __metadata("design:returntype", Promise)
], PageActionCEndController.prototype, "invoke", null);
__decorate([
    (0, common_1.Get)('page-action/runs/:id/stream'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：订阅 PageActionRun SSE',
        description: '重放进行中/已完成 run 的事件；与 invoke 返回的 streamUrl 对应。',
    }),
    (0, swagger_1.ApiProduces)('text/event-stream'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'page_action / page_workflow / host_action SSE' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], PageActionCEndController.prototype, "streamRun", null);
__decorate([
    (0, common_1.Get)('page-action/runs'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：PageAction 任务列表（automation 别名）',
        description: '等价于 GET /automation/tasks?triggerSource=page_action。',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_automation_task_dto_1.QueryAutomationTaskDto]),
    __metadata("design:returntype", void 0)
], PageActionCEndController.prototype, "listRuns", null);
PageActionCEndController = __decorate([
    (0, swagger_1.ApiTags)('page-action'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [page_action_c_end_service_1.PageActionCEndService])
], PageActionCEndController);
exports.PageActionCEndController = PageActionCEndController;
//# sourceMappingURL=page-action-c-end.controller.js.map