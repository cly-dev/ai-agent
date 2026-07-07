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
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const agent_service_1 = require("./agent.service");
const bind_agent_tools_dto_1 = require("./dto/bind-agent-tools.dto");
const create_agent_dto_1 = require("./dto/create-agent.dto");
const query_agent_tools_dto_1 = require("./dto/query-agent-tools.dto");
const update_agent_dto_1 = require("./dto/update-agent.dto");
let AgentController = class AgentController {
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
    findAll() {
        return this.service.findAll();
    }
    findByAppClient(appClientId) {
        return this.service.findByAppClientId(appClientId);
    }
    listForClient(req) {
        return this.service.findClientListByAppClientId(this.appClientId(req));
    }
    listAvailableForClient(req) {
        return this.service.findClientAvailableAgentsForUser(this.userId(req), this.appClientId(req));
    }
    getAgentTools(agentId, appClientId, query) {
        return this.service.getToolsForAgent(agentId, appClientId, query);
    }
    addAgentTools(agentId, appClientId, body) {
        return this.service.addToolsToAgent(agentId, appClientId, body);
    }
    removeAgentTools(agentId, appClientId, body) {
        return this.service.removeToolsFromAgent(agentId, appClientId, body);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    remove(id) {
        return this.service.remove(id);
    }
    getAllowedTools(req, agentId, userId) {
        return this.service.getAllowedTools(agentId, userId, this.appClientId(req));
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建 Agent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_agent_dto_1.CreateAgentDto]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '查询 Agent 列表（含 HTTP tools；Host Tool 仅 hostToolCount）' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({
        summary: '按 AppClient（接入方）ID 查询 Agent 列表（不含 tools，请用 GET :agentId/app-client/:appClientId/tools）',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "findByAppClient", null);
__decorate([
    (0, common_1.Get)('client/list'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：查询当前 App 下的 Agent 列表',
        description: '返回 id、name、description；需用户 JWT + x-app-dsn',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "listForClient", null);
__decorate([
    (0, common_1.Get)('client/available'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：返回当前用户可用的 Agent 列表',
        description: '仅需用户 JWT + x-app-dsn。UserApp.role → RoleTool 与 Agent 绑定 Tool 求交集；至少有一个可用 Tool 的 Agent 才会返回。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "listAvailableForClient", null);
__decorate([
    (0, common_1.Get)(':agentId/app-client/:appClientId/tools'),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number, description: 'Agent ID' }),
    (0, swagger_1.ApiParam)({
        name: 'appClientId',
        type: Number,
        description: 'AppClient（接入方）ID',
    }),
    (0, swagger_1.ApiOperation)({
        summary: '分页查询 Agent 已绑定 Tool，支持按 Tool 字段筛选（id/name/keyword/riskLevel 等）',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent 不存在或不属于该 AppClient' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, query_agent_tools_dto_1.QueryAgentToolsDto]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "getAgentTools", null);
__decorate([
    (0, common_1.Post)(':agentId/app-client/:appClientId/tools'),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number, description: 'Agent ID' }),
    (0, swagger_1.ApiParam)({
        name: 'appClientId',
        type: Number,
        description: 'AppClient（接入方）ID',
    }),
    (0, swagger_1.ApiOperation)({
        summary: '为 Agent 绑定 Tool（追加，已存在则跳过；Tool 须属于该 AppClient）',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '绑定成功，返回当前全部已绑定 Tool' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Tool ID 无效或不属于该 AppClient' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent 不存在或不属于该 AppClient' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, bind_agent_tools_dto_1.BindAgentToolsDto]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "addAgentTools", null);
__decorate([
    (0, common_1.Delete)(':agentId/app-client/:appClientId/tools'),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number, description: 'Agent ID' }),
    (0, swagger_1.ApiParam)({
        name: 'appClientId',
        type: Number,
        description: 'AppClient（接入方）ID',
    }),
    (0, swagger_1.ApiOperation)({
        summary: '为 Agent 解绑 Tool（未绑定的 ID 忽略；Tool 须属于该 AppClient）',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '解绑成功，返回当前剩余已绑定 Tool' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Tool ID 无效或不属于该 AppClient' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent 不存在或不属于该 AppClient' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, bind_agent_tools_dto_1.BindAgentToolsDto]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "removeAgentTools", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 Agent ID 查询详情（含关联 tools）' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 更新 Agent' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_agent_dto_1.UpdateAgentDto]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 删除 Agent' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'Agent ID' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', type: Number, description: '用户 ID' }),
    (0, swagger_1.ApiOperation)({ summary: '按用户角色过滤 Agent 可用工具' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功，返回可用工具列表' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent 或用户不存在' }),
    (0, common_1.Get)(':id/allowed-tools'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('userId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", void 0)
], AgentController.prototype, "getAllowedTools", null);
AgentController = __decorate([
    (0, swagger_1.ApiTags)('agent'),
    (0, common_1.Controller)('agent'),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], AgentController);
exports.AgentController = AgentController;
//# sourceMappingURL=agent.controller.js.map