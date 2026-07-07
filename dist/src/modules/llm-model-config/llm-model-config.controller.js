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
exports.LlmModelConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../generated/prisma/client");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const admin_role_guard_1 = require("../../auth/admin-role.guard");
const update_intent_recall_config_dto_1 = require("./dto/update-intent-recall-config.dto");
const update_llm_model_config_dto_1 = require("./dto/update-llm-model-config.dto");
const upsert_llm_model_config_dto_1 = require("./dto/upsert-llm-model-config.dto");
const llm_model_config_service_1 = require("./llm-model-config.service");
let LlmModelConfigController = class LlmModelConfigController {
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
    findByKind(kind) {
        return this.service.findByKind(kind);
    }
    create(body) {
        return this.service.create(body);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    activate(id) {
        return this.service.activate(id);
    }
    testConnection(id) {
        return this.service.testConnection(id);
    }
    getIntentRecall() {
        return this.service.getIntentRecallConfig();
    }
    updateIntentRecall(body) {
        return this.service.updateIntentRecallConfig(body);
    }
};
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '列出全部 LLM / Embedding 配置（同 kind 可多条）' }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('kind/:kind'),
    (0, swagger_1.ApiOperation)({ summary: '按 kind 查询配置列表（enabled=true 优先）' }),
    (0, swagger_1.ApiParam)({ name: 'kind', enum: client_1.LlmModelKind }),
    __param(0, (0, common_1.Param)('kind')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "findByKind", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '新增一条模型配置（同 kind 可多条）' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_llm_model_config_dto_1.UpsertLlmModelConfigDto]),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '按 id 更新模型配置' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_llm_model_config_dto_1.UpdateLlmModelConfigDto]),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, swagger_1.ApiOperation)({ summary: '激活指定模型配置（同 kind 仅一条启用）' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/test-connection'),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.OPERATOR),
    (0, swagger_1.ApiOperation)({
        summary: '探测 LLM / Embedding 配置连通性',
        description: 'Chat：最小 invoke；api_embedding：单次 embedding 请求；transformers_embedding：本地模型加载探测。',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200 }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Get)('intent-recall'),
    (0, swagger_1.ApiOperation)({ summary: '获取意图召回配置' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "getIntentRecall", null);
__decorate([
    (0, common_1.Put)('intent-recall'),
    (0, swagger_1.ApiOperation)({ summary: '更新意图召回配置' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_intent_recall_config_dto_1.UpdateIntentRecallConfigDto]),
    __metadata("design:returntype", void 0)
], LlmModelConfigController.prototype, "updateIntentRecall", null);
LlmModelConfigController = __decorate([
    (0, swagger_1.ApiTags)('llm-model-config'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('llm-model-config'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    __metadata("design:paramtypes", [llm_model_config_service_1.LlmModelConfigService])
], LlmModelConfigController);
exports.LlmModelConfigController = LlmModelConfigController;
//# sourceMappingURL=llm-model-config.controller.js.map