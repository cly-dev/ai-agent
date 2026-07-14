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
exports.PageAgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const page_agent_audit_dto_1 = require("./dto/page-agent-audit.dto");
const page_agent_proxy_service_1 = require("./page-agent-proxy.service");
let PageAgentController = class PageAgentController {
    constructor(service) {
        this.service = service;
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
    async chatCompletions(req, body, res) {
        await this.service.proxyChatCompletions({
            userId: this.userId(req),
            appClientId: this.appClientId(req),
            body,
            req,
            res,
        });
    }
    findAuditPage(appClientId, query) {
        return this.service.findAuditPage(appClientId, query);
    }
    findAuditDetail(appClientId, id) {
        return this.service.findAuditDetail(appClientId, id);
    }
};
__decorate([
    (0, common_1.Post)('compatible-mode/v1/chat/completions'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：PageAgent OpenAI-compatible LLM 代理',
        description: '前端不传 provider key；服务端使用 DB 中启用的 LlmModelConfig(kind=chat)，默认按非流式 JSON 调用上游并记录轻量审计。',
    }),
    (0, swagger_1.ApiProduces)('application/json'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenAI-compatible JSON' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PageAgentController.prototype, "chatCompletions", null);
__decorate([
    (0, common_1.Get)('llm-proxy-audit/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'B 端：分页查询 PageAgent LLM 代理审计' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, page_agent_audit_dto_1.QueryPageAgentLlmProxyAuditDto]),
    __metadata("design:returntype", void 0)
], PageAgentController.prototype, "findAuditPage", null);
__decorate([
    (0, common_1.Get)('llm-proxy-audit/by-app-client/:appClientId/:id'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'B 端：PageAgent LLM 代理审计详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], PageAgentController.prototype, "findAuditDetail", null);
PageAgentController = __decorate([
    (0, swagger_1.ApiTags)('page-agent'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('page-agent'),
    __metadata("design:paramtypes", [page_agent_proxy_service_1.PageAgentProxyService])
], PageAgentController);
exports.PageAgentController = PageAgentController;
//# sourceMappingURL=page-agent.controller.js.map