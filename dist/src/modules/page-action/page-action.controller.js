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
exports.PageActionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const page_action_dto_1 = require("./dto/page-action.dto");
const page_action_service_1 = require("./page-action.service");
let PageActionController = class PageActionController {
    constructor(service) {
        this.service = service;
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
    create(body) {
        return this.service.create(body);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    findPage(appClientId, query) {
        return this.service.findPage(Object.assign(Object.assign({}, query), { appClientId }));
    }
    listPageScopes(appClientId, query) {
        return this.service.listPageScopes(appClientId, query);
    }
    findRunPageAdmin(appClientId, query) {
        return this.service.findRunPageAdmin(appClientId, query);
    }
    findRunAdminById(id) {
        return this.service.findRunAdmin(id);
    }
    findRunAdmin(id) {
        return this.service.findRunAdmin(id);
    }
    async invoke(req, body, res) {
        await this.service.invoke(this.userId(req), this.appClientId(req), body, res);
    }
};
__decorate([
    (0, common_1.Post)('page-action'),
    (0, swagger_1.ApiOperation)({
        summary: 'B 端：创建 PageAction',
        description: '须绑定已存在的 HostTool（hostToolId）。未绑 workflowId 时 hostToolId 必填；纯分析类 Workflow 可不绑。',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [page_action_dto_1.CreatePageActionDto]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('page-action/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'B 端：更新 PageAction' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, page_action_dto_1.UpdatePageActionDto]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('page-action/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'B 端：PageAction 详情' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('page-action/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'B 端：分页查询 App 下 PageAction' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, page_action_dto_1.QueryPageActionDto]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)('page-action/page-scopes/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'B 端：获取 App 下全部 pageScope（下拉选项）',
        description: '主数据来自 HostPage.scope；合并 PageAction 已使用但未登记的 scope。默认仅含启用中的 HostPage。',
    }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, page_action_dto_1.QueryPageScopeOptionsDto]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "listPageScopes", null);
__decorate([
    (0, common_1.Get)('page-action/run/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'B 端：分页查询 PageActionRun 运行记录' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, page_action_dto_1.QueryPageActionRunDto]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "findRunPageAdmin", null);
__decorate([
    (0, common_1.Get)('page-action/run/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'B 端：PageActionRun 详情（含运行步骤 steps）',
        description: '与 GET page-action/run/detail/:id 相同。',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "findRunAdminById", null);
__decorate([
    (0, common_1.Get)('page-action/run/detail/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'B 端：PageActionRun 详情（含运行步骤 steps）',
        description: '与 GET page-action/run/:id 相同（保留兼容路径）。',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PageActionController.prototype, "findRunAdmin", null);
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
        summary: 'C 端：one-shot 执行 PageAction',
        description: '响应为 text/event-stream（host_action DSL 真流式 + page_action 生命周期）。无需 Chat session。',
    }),
    (0, swagger_1.ApiProduces)('text/event-stream'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'inline_stream SSE' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, page_action_dto_1.InvokePageActionDto, Object]),
    __metadata("design:returntype", Promise)
], PageActionController.prototype, "invoke", null);
PageActionController = __decorate([
    (0, swagger_1.ApiTags)('page-action'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [page_action_service_1.PageActionService])
], PageActionController);
exports.PageActionController = PageActionController;
//# sourceMappingURL=page-action.controller.js.map