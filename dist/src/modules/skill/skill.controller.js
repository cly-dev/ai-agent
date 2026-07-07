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
exports.SkillController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_client_dsn_guard_1 = require("../../auth/app-client-dsn.guard");
const app_client_dsn_constants_1 = require("../../auth/app-client-dsn.constants");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const skill_service_1 = require("./skill.service");
const create_skill_dto_1 = require("./dto/create-skill.dto");
const query_client_skill_by_agent_dto_1 = require("./dto/query-client-skill-by-agent.dto");
const query_skill_dto_1 = require("./dto/query-skill.dto");
const skill_tool_binding_dto_1 = require("./dto/skill-tool-binding.dto");
const update_skill_dto_1 = require("./dto/update-skill.dto");
let SkillController = class SkillController {
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
    listForClientByAgent(req, agentId, query) {
        return this.service.findClientListByAgentForUser(agentId, this.userId(req), this.appClientId(req), query);
    }
    createForAppClient(appClientId, body) {
        return this.service.createForAppClient(appClientId, body);
    }
    create(agentId, appClientId, body) {
        return this.service.create(agentId, appClientId, body);
    }
    findByAgent(agentId, appClientId, query) {
        return this.service.findPageByAgent(agentId, appClientId, query);
    }
    findByAppClient(appClientId, query) {
        return this.service.findPageByAppClient(appClientId, query);
    }
    findOne(skillId) {
        return this.service.findOne(skillId);
    }
    update(skillId, body) {
        return this.service.update(skillId, body);
    }
    replaceTools(skillId, body) {
        return this.service.replaceTools(skillId, body);
    }
    remove(skillId) {
        return this.service.remove(skillId);
    }
};
__decorate([
    (0, common_1.Get)('agent/:agentId/skills/client'),
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard, app_client_dsn_guard_1.AppClientDsnGuard),
    (0, swagger_1.ApiSecurity)('app-dsn'),
    (0, swagger_1.ApiHeader)({
        name: app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER,
        description: '业务方 DSN',
        required: true,
    }),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'C 端：按 Agent 查询当前用户可运行的 Skill 列表',
        description: 'UserApp.role → RoleSkill 白名单（若已配置）；仅 active Skill，且 Skill 至少有一个可运行 HTTP Tool 或 Agent 白名单内的 SkillHostTool（与发消息 skillId 校验一致）。可选 query.page 按页面 scope 过滤（与 pageContext.page 一致）。不含 prompt/config。需用户 JWT + x-app-dsn。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, query_client_skill_by_agent_dto_1.QueryClientSkillByAgentDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "listForClientByAgent", null);
__decorate([
    (0, common_1.Post)('app-client/:appClientId/skills'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '为 App 创建 Skill（推荐）',
        description: 'Skill 归属 AppClient；可选初始 SkillTool（须为 App 内 active Tool）。响应含嵌套 appClient。',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_skill_dto_1.CreateSkillDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "createForAppClient", null);
__decorate([
    (0, common_1.Post)('agent/:agentId/app-client/:appClientId/skills'),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '为 Agent 创建 Skill（兼容；会写入 AgentSkill）',
        description: '创建 App 级 Skill 并关联 AgentSkill。可选初始 SkillTool。响应含嵌套 appClient。',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, create_skill_dto_1.CreateSkillDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('agent/:agentId/app-client/:appClientId/skills'),
    (0, swagger_1.ApiParam)({ name: 'agentId', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '分页查询 Agent 下的 Skill 列表',
        description: '每条记录含嵌套 agent、appClient。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('agentId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, query_skill_dto_1.QuerySkillDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "findByAgent", null);
__decorate([
    (0, common_1.Get)('skill/by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '按 AppClient 分页查询 Skill（可选 agentId 筛选）',
        description: '每条记录含嵌套 agent、appClient。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_skill_dto_1.QuerySkillDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "findByAppClient", null);
__decorate([
    (0, common_1.Get)('skill/:skillId'),
    (0, swagger_1.ApiParam)({ name: 'skillId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询 Skill 详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('skillId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('skill/:skillId'),
    (0, swagger_1.ApiParam)({ name: 'skillId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 更新 Skill（不含工具绑定）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('skillId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_skill_dto_1.UpdateSkillDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "update", null);
__decorate([
    (0, common_1.Put)('skill/:skillId/tools'),
    (0, swagger_1.ApiParam)({ name: 'skillId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '全量替换 Skill 关联工具',
        description: 'toolId 须属于该 Skill 所属 Agent 的 AgentTool。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '替换成功' }),
    __param(0, (0, common_1.Param)('skillId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, skill_tool_binding_dto_1.ReplaceSkillToolsDto]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "replaceTools", null);
__decorate([
    (0, common_1.Delete)('skill/:skillId'),
    (0, swagger_1.ApiParam)({ name: 'skillId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 删除 Skill（级联删除 SkillTool）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('skillId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SkillController.prototype, "remove", null);
SkillController = __decorate([
    (0, swagger_1.ApiTags)('skill'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [skill_service_1.SkillService])
], SkillController);
exports.SkillController = SkillController;
//# sourceMappingURL=skill.controller.js.map