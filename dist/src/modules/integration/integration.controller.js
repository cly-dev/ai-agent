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
exports.IntegrationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../generated/prisma/client");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const admin_role_guard_1 = require("../../auth/admin-role.guard");
const create_integration_dto_1 = require("./dto/create-integration.dto");
const query_integration_dto_1 = require("./dto/query-integration.dto");
const test_integration_connection_dto_1 = require("./dto/test-integration-connection.dto");
const update_integration_dto_1 = require("./dto/update-integration.dto");
const integration_service_1 = require("./integration.service");
let IntegrationController = class IntegrationController {
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
    testConnectionByUrl(body) {
        return this.service.testConnection({
            baseUrl: body.baseUrl,
            apiKey: body.apiKey,
        });
    }
    testConnectionById(id, body) {
        return this.service.testConnection(Object.assign({ id }, body));
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
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: '创建 Integration' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_integration_dto_1.CreateIntegrationDto]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: '分页查询 Integration 列表',
        description: '支持分页与字段筛选。每条记录返回 appClient、tools 关联及 systemConfigured 字段。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_integration_dto_1.QueryIntegrationDto]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number, description: 'AppClient ID' }),
    (0, swagger_1.ApiOperation)({
        summary: '按 AppClient ID 分页查询 Integration 列表',
        description: '返回指定 appClient 下的 Integration，支持分页、排序及 name/baseUrl/keyword 等筛选。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, query_integration_dto_1.QueryIntegrationDto]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "findByAppClient", null);
__decorate([
    (0, common_1.Post)('test-connection'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: '探测 baseUrl 是否可访问（未保存配置）',
        description: '对请求体中的 baseUrl 发起 HTTP 探测，可选 apiKey 作为 Bearer。用于创建/编辑表单保存前校验。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '探测完成（reachable 为 false 时仍为 200）' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_integration_connection_dto_1.TestIntegrationConnectionByUrlDto]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "testConnectionByUrl", null);
__decorate([
    (0, common_1.Post)(':id/test-connection'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '探测已保存 Integration 的 baseUrl 是否可访问',
        description: '默认使用库中 baseUrl / apiKey；请求体可临时覆盖。返回是否可达、HTTP 状态与耗时。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '探测完成' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, test_integration_connection_dto_1.TestIntegrationConnectionDto]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "testConnectionById", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 查询 Integration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 更新 Integration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_integration_dto_1.UpdateIntegrationDto]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '按 ID 删除 Integration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], IntegrationController.prototype, "remove", null);
IntegrationController = __decorate([
    (0, swagger_1.ApiTags)('integration'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('integration'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    __metadata("design:paramtypes", [integration_service_1.IntegrationService])
], IntegrationController);
exports.IntegrationController = IntegrationController;
//# sourceMappingURL=integration.controller.js.map