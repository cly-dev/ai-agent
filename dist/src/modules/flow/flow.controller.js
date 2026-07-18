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
exports.FlowController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const client_1 = require("../../../generated/prisma/client");
const flow_dto_1 = require("./dto/flow.dto");
const flow_service_1 = require("./flow.service");
let FlowController = class FlowController {
    constructor(service) {
        this.service = service;
    }
    create(body) {
        return this.service.create(body);
    }
    allocateStateKeys(body) {
        return this.service.allocateIntentStateKeys(body.labels);
    }
    migrateFromWorkflow(workflowId, body) {
        return this.service.migrateFromWorkflow(workflowId, body);
    }
    previewMigrateFromWorkflow(workflowId, flowKey) {
        return this.service.previewMigrateFromWorkflow(workflowId, flowKey);
    }
    listMigrationCandidates(appClientId) {
        return this.service.listMigrationCandidates({ appClientId });
    }
    listPresets(query) {
        return this.service.listPresets(query.profile);
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
    (0, swagger_1.ApiOperation)({ summary: '创建 Flow（Intent SSOT → 编译 IR）' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flow_dto_1.CreateFlowDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('intent/state-keys'),
    (0, swagger_1.ApiOperation)({
        summary: '分配 Intent state.key',
        description: '画布「当…」边：运营填状态名称，服务端按与 slugWorkflowIntentStateKey 相同算法生成不重复 key。',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flow_dto_1.AllocateWorkflowIntentStateKeysDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "allocateStateKeys", null);
__decorate([
    (0, common_1.Post)('migrate-from-workflow/:workflowId'),
    (0, swagger_1.ApiParam)({ name: 'workflowId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'Legacy Workflow → Flow',
        description: '从 Workflow.nodes 启发式推断 Intent，创建 Flow；可选改绑 Skill/PageAction 并停用源 Workflow。建议先调 preview。',
    }),
    __param(0, (0, common_1.Param)('workflowId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, flow_dto_1.MigrateFlowFromWorkflowDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "migrateFromWorkflow", null);
__decorate([
    (0, common_1.Get)('migrate-from-workflow/:workflowId/preview'),
    (0, swagger_1.ApiParam)({ name: 'workflowId', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '迁移预览（不写库）',
        description: '返回推断 Intent、warnings、将改绑的 Skill/PageAction 数量、flowKey 是否可用。',
    }),
    __param(0, (0, common_1.Param)('workflowId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('flowKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "previewMigrateFromWorkflow", null);
__decorate([
    (0, common_1.Get)('migration-candidates'),
    (0, swagger_1.ApiOperation)({
        summary: '待迁移 legacy Workflow 列表',
        description: '返回仍被 Skill / PageAction 引用的 Workflow，供迁移页使用。',
    }),
    __param(0, (0, common_1.Query)('appClientId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "listMigrationCandidates", null);
__decorate([
    (0, common_1.Get)('presets/catalog'),
    (0, swagger_1.ApiOperation)({
        summary: 'Flow 场景 Preset 目录',
        description: '仅三张产品卡：页内回填 / 拉数作答 / 变更提交。',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [flow_dto_1.QueryFlowPresetCatalogDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "listPresets", null);
__decorate([
    (0, common_1.Get)('by-app-client/:appClientId'),
    (0, swagger_1.ApiParam)({ name: 'appClientId', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '分页查询 App 下 Flow' }),
    __param(0, (0, common_1.Param)('appClientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, flow_dto_1.QueryFlowDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "findPage", null);
__decorate([
    (0, common_1.Get)(':id/revisions/:version'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiParam)({ name: 'version', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '查看 Flow 指定版本（intent + ir）' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('version', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "findRevision", null);
__decorate([
    (0, common_1.Get)(':id/revisions'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: 'Flow revision 历史',
        description: '默认返回完整 intent/ir；summary=true 时仅版本元数据。',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, flow_dto_1.QueryFlowRevisionsDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "listRevisions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: 'Flow 详情（含 intent + ir）' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '更新 Flow' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, flow_dto_1.UpdateFlowDto]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '删除 Flow' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FlowController.prototype, "remove", null);
FlowController = __decorate([
    (0, swagger_1.ApiTags)('flow'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('flow'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.OPERATOR),
    __metadata("design:paramtypes", [flow_service_1.FlowService])
], FlowController);
exports.FlowController = FlowController;
//# sourceMappingURL=flow.controller.js.map