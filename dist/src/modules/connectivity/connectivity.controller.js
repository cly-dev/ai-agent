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
exports.ConnectivityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../generated/prisma/client");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const admin_role_guard_1 = require("../../auth/admin-role.guard");
const connectivity_service_1 = require("./connectivity.service");
const run_connectivity_checks_dto_1 = require("./dto/run-connectivity-checks.dto");
let ConnectivityController = class ConnectivityController {
    constructor(service) {
        this.service = service;
    }
    checkDatabase() {
        return this.service.checkDatabase();
    }
    checkRedis() {
        return this.service.checkRedis();
    }
    checkLlmChat() {
        return this.service.checkLlmChat();
    }
    checkLlmEmbedding() {
        return this.service.checkLlmEmbedding();
    }
    runBatch(body) {
        return this.service.runBatch(body.targets);
    }
    async summary() {
        return this.service.runBatch(['database', 'redis']);
    }
};
__decorate([
    (0, common_1.Get)('database'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: '检测 PostgreSQL 连通性' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConnectivityController.prototype, "checkDatabase", null);
__decorate([
    (0, common_1.Get)('redis'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: '检测 Redis 连通性' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConnectivityController.prototype, "checkRedis", null);
__decorate([
    (0, common_1.Post)('llm/chat'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: '检测当前启用的 Chat LLM 连通性' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConnectivityController.prototype, "checkLlmChat", null);
__decorate([
    (0, common_1.Post)('llm/embedding'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({ summary: '检测当前启用的 Embedding 连通性' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConnectivityController.prototype, "checkLlmEmbedding", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: '批量检测基础设施连通性',
        description: '默认检测 database / redis / llm_chat / llm_embedding。Integration、Tool、AppClient 鉴权请使用各自模块的 test 接口。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [run_connectivity_checks_dto_1.RunConnectivityChecksDto]),
    __metadata("design:returntype", void 0)
], ConnectivityController.prototype, "runBatch", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: '只读基础设施连通性摘要（database + redis）',
    }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConnectivityController.prototype, "summary", null);
ConnectivityController = __decorate([
    (0, swagger_1.ApiTags)('connectivity'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('connectivity'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    __metadata("design:paramtypes", [connectivity_service_1.ConnectivityService])
], ConnectivityController);
exports.ConnectivityController = ConnectivityController;
//# sourceMappingURL=connectivity.controller.js.map