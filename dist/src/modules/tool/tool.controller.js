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
exports.ToolController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../generated/prisma/client");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const admin_role_guard_1 = require("../../auth/admin-role.guard");
const tool_service_1 = require("./tool.service");
const batch_set_tools_active_dto_1 = require("./dto/batch-set-tools-active.dto");
const create_tool_dto_1 = require("./dto/create-tool.dto");
const debug_tool_dto_1 = require("./dto/debug-tool.dto");
const init_tool_schemas_from_debug_dto_1 = require("./dto/init-tool-schemas-from-debug.dto");
const import_tools_from_swagger_dto_1 = require("./dto/import-tools-from-swagger.dto");
const query_tool_dto_1 = require("./dto/query-tool.dto");
const update_tool_dto_1 = require("./dto/update-tool.dto");
let ToolController = class ToolController {
    constructor(service) {
        this.service = service;
    }
    create(body) {
        return this.service.create(body);
    }
    findPage(query) {
        return this.service.findPage(query);
    }
    findByAppClient(appClientId, query) {
        return this.service.findPageByAppClientId(appClientId, query);
    }
    initSchemasFromDebug(appClientId, id, body) {
        return this.service.initSchemasFromDebug(appClientId, id, body);
    }
    importFromSwagger(body) {
        return this.service.importFromSwagger(body);
    }
    batchSetActive(body) {
        return this.service.batchSetActive(body);
    }
    debug(id, body) {
        return this.service.debug(id, body);
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
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建工具' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tool_dto_1.CreateToolDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '分页查询工具列表',
        description: '支持分页与字段筛选。每条记录返回完整关联：appClient、toolCategory（类目 label 同时出现在 tags 数组）、integration、agentTools/skillTools/roleTools 及嵌套实体。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_tool_dto_1.QueryToolDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({
        summary: '按 AppClient ID 分页查询工具列表',
        description: '返回指定 appClient 下的工具，支持分页、排序及 name/keyword/integrationId 等筛选。路径中的 appClientId 优先于 Query 中的同名参数。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_tool_dto_1.QueryToolDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "findByAppClient", null);
__decorate([
    (0, common_1.Post)('by-app-client/:appClientId/:id/debug/init-schemas'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'Tool ID' }),
    (0, swagger_1.ApiOperation)({
        summary: '调试 Tool 并由大模型初始化 schema / responseProfile / agentMetadata',
        description: '先按工具配置发起真实 HTTP 调试请求；成功后由大模型根据响应样本推断 outputSchema、responseProfile、agentMetadata（含 mode/resource/operation/businessFields 等），默认写回该 Tool（persist=true）。LLM 未返回合法 agentMetadata 时使用启发式或保留已有配置。工具必须属于路径中的 appClientId。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '推断并更新成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, init_tool_schemas_from_debug_dto_1.InitToolSchemasFromDebugDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "initSchemasFromDebug", null);
__decorate([
    (0, common_1.Post)('import/swagger'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: '从 Swagger/OpenAPI URL 导入工具',
        description: '拉取 OpenAPI 文档并 upsert Tool、ToolCategory、RoleTool（与 swagger-tool-cli --apply 逻辑一致）。风险等级按 HTTP 方法自动设置：GET=L1，POST/PUT/PATCH=L2，DELETE=L3。未传 tags/ops/pathInclude 时导入 path 过滤后的全部接口（默认排除 public、buyer）。',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '导入完成' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_tools_from_swagger_dto_1.ImportToolsFromSwaggerDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "importFromSwagger", null);
__decorate([
    (0, common_1.Patch)('batch/status'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: '批量更新工具启用状态',
        description: '统一设置 isActive：true 批量启用，false 批量禁用。不存在的 ID 会出现在 notFoundIds 中。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '批量更新完成' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_set_tools_active_dto_1.BatchSetToolsActiveDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "batchSetActive", null);
__decorate([
    (0, common_1.Post)(':id/debug'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '调试 Tool HTTP 调用',
        description: '按工具配置的 method/path/integration 发起真实请求。可传 parameters（path/query/body）、headers、apiKey、timeoutMs。返回请求与响应详情（敏感头已脱敏）。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '调试完成（HTTP 非 2xx 时 ok 为 false，仍返回 200）' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, debug_tool_dto_1.DebugToolDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "debug", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询工具' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 更新工具' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_tool_dto_1.UpdateToolDto]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 删除工具' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ToolController.prototype, "remove", null);
ToolController = __decorate([
    (0, swagger_1.ApiTags)('tool'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tool'),
    __metadata("design:paramtypes", [tool_service_1.ToolService])
], ToolController);
exports.ToolController = ToolController;
//# sourceMappingURL=tool.controller.js.map