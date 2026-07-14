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
exports.AutomationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const automation_task_service_1 = require("./automation-task.service");
const query_automation_task_dto_1 = require("./dto/query-automation-task.dto");
let AutomationController = class AutomationController {
    constructor(automationTasks) {
        this.automationTasks = automationTasks;
    }
    async listTasks(req, query) {
        return this.automationTasks.list({
            appClientId: req.appClient.id,
            userId: req.user.userId,
            status: query.status,
            triggerSource: query.triggerSource,
            actionKey: query.actionKey,
            workflowKey: query.workflowKey,
            limit: query.limit,
            offset: query.offset,
        });
    }
    async getPageActionRunTask(req, id) {
        return this.automationTasks.getDetail({
            kind: 'page_action_run',
            id,
            appClientId: req.appClient.id,
            userId: req.user.userId,
        });
    }
};
__decorate([
    (0, common_1.Get)('tasks'),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：自动化任务列表',
        description: 'v1 仅含 page_action；triggerSource=webhook 返回空列表。',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_automation_task_dto_1.QueryAutomationTaskDto]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('tasks/page_action_run/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'C 端：page_action 任务详情' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], AutomationController.prototype, "getPageActionRunTask", null);
AutomationController = __decorate([
    (0, swagger_1.ApiTags)('automation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, common_1.Controller)('automation'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    __metadata("design:paramtypes", [automation_task_service_1.AutomationTaskService])
], AutomationController);
exports.AutomationController = AutomationController;
//# sourceMappingURL=automation.controller.js.map