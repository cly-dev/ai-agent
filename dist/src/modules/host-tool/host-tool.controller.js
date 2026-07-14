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
exports.HostToolController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const host_page_dto_1 = require("./dto/host-page.dto");
const host_tool_dto_1 = require("./dto/host-tool.dto");
const host_tool_binding_dto_1 = require("./dto/host-tool-binding.dto");
const host_tool_service_1 = require("./host-tool.service");
let HostToolController = class HostToolController {
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
    clientCatalog(req, query) {
        return this.service.findClientCatalog(this.appClientId(req), query);
    }
    clientRegister(req, body) {
        return this.service.registerClientHostTools(this.appClientId(req), body);
    }
    createHostPage(body) {
        return this.service.createHostPage(body);
    }
    findHostPagePage(appClientId, query) {
        return this.service.findHostPagePage(appClientId, query);
    }
    findHostPageOne(id) {
        return this.service.findHostPageOne(id);
    }
    updateHostPage(id, body) {
        return this.service.updateHostPage(id, body);
    }
    removeHostPage(id) {
        return this.service.removeHostPage(id);
    }
    createHostTool(body) {
        return this.service.createHostTool(body);
    }
    findHostToolPage(appClientId, query) {
        return this.service.findHostToolPage(appClientId, query);
    }
    findHostToolOne(id) {
        return this.service.findHostToolOne(id);
    }
    updateHostTool(id, body) {
        return this.service.updateHostTool(id, body);
    }
    removeHostTool(id) {
        return this.service.removeHostTool(id);
    }
    getAgentHostTools(agentId, appClientId, query) {
        return this.service.getHostToolsForAgent(agentId, appClientId, query);
    }
    addAgentHostTools(agentId, appClientId, body) {
        return this.service.addHostToolsToAgent(agentId, appClientId, body);
    }
    removeAgentHostTools(agentId, appClientId, body) {
        return this.service.removeHostToolsFromAgent(agentId, appClientId, body);
    }
    listSkillHostTools(skillId) {
        return this.service.listSkillHostToolBindings(skillId);
    }
    replaceSkillHostTools(skillId, body) {
        return this.service.replaceSkillHostTools(skillId, body);
    }
};
__decorate([
    (0, common_1.Get)('host-tool/client/catalog'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：查询当前 App 可用的 Host Tool 目录',
        description: '可选 scope（pageContext.page）与 agentId（Agent 白名单过滤）。执行仍在浏览器 registry。',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, host_tool_dto_1.QueryClientHostToolDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "clientCatalog", null);
__decorate([
    (0, common_1.Post)('host-tool/client/register'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：幂等注册 / 更新 Host Tool 元数据',
        description: '与前端 registry 同步：App 内同名工具首次创建，已存在则更新 description/argsSchema/argsTemplate/hostPage。页内工具带 scope 时自动 ensure HostPage。执行仍在浏览器。',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '注册结果（created + updated；skipped 恒空，兼容旧客户端）',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, host_tool_dto_1.RegisterClientHostToolsDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "clientRegister", null);
__decorate([
    (0, common_1.Post)('host-page'),
    (0, swagger_1.ApiOperation)({ summary: '创建 HostPage（页面登记）' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [host_page_dto_1.CreateHostPageDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "createHostPage", null);
__decorate([
    (0, common_1.Get)('host-page/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '分页查询 App 下的 HostPage' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, host_tool_dto_1.QueryHostPageDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "findHostPagePage", null);
__decorate([
    (0, common_1.Get)('host-page/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询 HostPage' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "findHostPageOne", null);
__decorate([
    (0, common_1.Patch)('host-page/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '更新 HostPage' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, host_page_dto_1.UpdateHostPageDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "updateHostPage", null);
__decorate([
    (0, common_1.Delete)('host-page/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '删除 HostPage（级联删除页内 HostTool）' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "removeHostPage", null);
__decorate([
    (0, common_1.Post)('host-tool'),
    (0, swagger_1.ApiOperation)({
        summary: '创建 HostTool',
        description: 'hostPageId 为空表示 App 内通用工具（如 refreshEntity）',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [host_tool_dto_1.CreateHostToolDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "createHostTool", null);
__decorate([
    (0, common_1.Get)('host-tool/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '分页查询 App 下的 HostTool' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, host_tool_dto_1.QueryHostToolDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "findHostToolPage", null);
__decorate([
    (0, common_1.Get)('host-tool/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询 HostTool' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "findHostToolOne", null);
__decorate([
    (0, common_1.Patch)('host-tool/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '更新 HostTool' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, host_tool_dto_1.UpdateHostToolDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "updateHostTool", null);
__decorate([
    (0, common_1.Delete)('host-tool/:id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '删除 HostTool' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "removeHostTool", null);
__decorate([
    (0, common_1.Get)('agent/:agentId/app-client/:appClientId/host-tools'),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '分页查询 Agent 可绑定的 HostTool（含 bound 标记）' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, host_tool_dto_1.QueryHostToolDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "getAgentHostTools", null);
__decorate([
    (0, common_1.Post)('agent/:agentId/app-client/:appClientId/host-tools'),
    (0, swagger_1.ApiOperation)({ summary: '为 Agent 绑定 HostTool（追加）' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, host_tool_binding_dto_1.BindAgentHostToolsDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "addAgentHostTools", null);
__decorate([
    (0, common_1.Delete)('agent/:agentId/app-client/:appClientId/host-tools'),
    (0, swagger_1.ApiOperation)({ summary: '为 Agent 解绑 HostTool' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, host_tool_binding_dto_1.BindAgentHostToolsDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "removeAgentHostTools", null);
__decorate([
    (0, common_1.Get)('skill/:skillId/host-tools'),
    (0, swagger_1.ApiParam)({ name: 'skillId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '查询 Skill 关联的 HostTool' }),
    __param(0, (0, common_1.Param)('skillId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "listSkillHostTools", null);
__decorate([
    (0, common_1.Put)('skill/:skillId/host-tools'),
    (0, swagger_1.ApiParam)({ name: 'skillId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '全量替换 Skill 关联 HostTool',
        description: 'hostToolId 须已出现在 AgentHostTool 中',
    }),
    __param(0, (0, common_1.Param)('skillId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, host_tool_binding_dto_1.ReplaceSkillHostToolsDto]),
    __metadata("design:returntype", void 0)
], HostToolController.prototype, "replaceSkillHostTools", null);
HostToolController = __decorate([
    (0, swagger_1.ApiTags)('host-tool'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [host_tool_service_1.HostToolService])
], HostToolController);
exports.HostToolController = HostToolController;
//# sourceMappingURL=host-tool.controller.js.map