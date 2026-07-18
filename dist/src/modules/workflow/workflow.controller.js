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
exports.WorkflowController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workflow_dto_1 = require("./dto/workflow.dto");
const workflow_service_1 = require("./workflow.service");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const client_1 = require("../../../generated/prisma/client");
let WorkflowController = class WorkflowController {
    constructor(service) {
        this.service = service;
    }
    listPresets(profile) {
        return this.service.listPresets(profile);
    }
    findPage(appClientId, query) {
        return this.service.findPage(Object.assign(Object.assign({}, query), { appClientId }));
    }
    findRevision(id, version) {
        return this.service.findRevision(id, version);
    }
    listRevisions(id, query) {
        return this.service.listRevisions(id, query);
    }
    remove(id) {
        return this.service.remove(id);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
};
__decorate([
    (0, common_1.Get)('presets/catalog'),
    (0, swagger_1.ApiOperation)({
        summary: '【归档】Preset 目录（请改用 GET /flow/presets/catalog）',
        deprecated: true,
    }),
    __param(0, (0, common_1.Query)('profile')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "listPresets", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '【归档】分页查询仍存库的 legacy Workflow',
        description: '用于迁移候选对照；新配置勿依赖本列表。',
    }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, workflow_dto_1.QueryWorkflowDto]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)(':id/revisions/:version'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'version', type: Number, description: 'revision 版本号' }),
    (0, swagger_1.ApiOperation)({ summary: '查看 Workflow 指定版本快照' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('version', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "findRevision", null);
__decorate([
    (0, common_1.Get)(':id/revisions'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'Workflow revision 历史',
        description: '默认返回完整快照；summary=true 时仅返回版本元数据，适合版本下拉。',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, workflow_dto_1.QueryWorkflowRevisionsDto]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "listRevisions", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '删除 legacy Workflow' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'Workflow 详情' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], WorkflowController.prototype, "findOne", null);
WorkflowController = __decorate([
    (0, swagger_1.ApiTags)('workflow'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('workflow'),
    __metadata("design:paramtypes", [workflow_service_1.WorkflowService])
], WorkflowController);
exports.WorkflowController = WorkflowController;
//# sourceMappingURL=workflow.controller.js.map