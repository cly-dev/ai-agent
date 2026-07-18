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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrateFlowFromWorkflowDto = exports.QueryFlowDto = exports.AllocateWorkflowIntentStateKeysDto = exports.QueryFlowPresetCatalogDto = exports.QueryFlowRevisionsDto = exports.UpdateFlowDto = exports.CreateFlowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
const pagination_1 = require("../../../common/pagination");
const workflow_dto_1 = require("../../workflow/dto/workflow.dto");
class CreateFlowDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateFlowDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'campaign.auto_fill' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "flowKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "goal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.WorkflowProfile }),
    (0, class_validator_1.IsEnum)(client_1.WorkflowProfile),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "profile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkflowDeliverable, default: client_1.WorkflowDeliverable.answer }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowDeliverable),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "deliverable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: workflow_dto_1.WORKFLOW_PRESET_KIND_VALUES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...workflow_dto_1.WORKFLOW_PRESET_KIND_VALUES]),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "preset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset != null),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFlowDto.prototype, "presetConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WorkflowIntent；与 preset 二选一',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset == null),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateFlowDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateFlowDto.prototype, "constraints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFlowDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateFlowDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [workflow_dto_1.WorkflowToolBindingDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => workflow_dto_1.WorkflowToolBindingDto),
    __metadata("design:type", Array)
], CreateFlowDto.prototype, "tools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [workflow_dto_1.WorkflowHostToolBindingDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => workflow_dto_1.WorkflowHostToolBindingDto),
    __metadata("design:type", Array)
], CreateFlowDto.prototype, "hostTools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateFlowDto.prototype, "changeNote", void 0);
exports.CreateFlowDto = CreateFlowDto;
class UpdateFlowDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateFlowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateFlowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateFlowDto.prototype, "goal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkflowDeliverable }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowDeliverable),
    __metadata("design:type", String)
], UpdateFlowDto.prototype, "deliverable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: workflow_dto_1.WORKFLOW_PRESET_KIND_VALUES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...workflow_dto_1.WORKFLOW_PRESET_KIND_VALUES]),
    __metadata("design:type", String)
], UpdateFlowDto.prototype, "preset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset != null),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateFlowDto.prototype, "presetConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset == null),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateFlowDto.prototype, "intent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateFlowDto.prototype, "constraints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateFlowDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateFlowDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [workflow_dto_1.WorkflowToolBindingDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => workflow_dto_1.WorkflowToolBindingDto),
    __metadata("design:type", Array)
], UpdateFlowDto.prototype, "tools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [workflow_dto_1.WorkflowHostToolBindingDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => workflow_dto_1.WorkflowHostToolBindingDto),
    __metadata("design:type", Array)
], UpdateFlowDto.prototype, "hostTools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateFlowDto.prototype, "changeNote", void 0);
exports.UpdateFlowDto = UpdateFlowDto;
class QueryFlowRevisionsDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: 20,
        description: '返回条数上限，最大 100',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryFlowRevisionsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'true 时仅返回版本元数据（version / changeNote / isCurrent），不含 intent/ir 快照',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryFlowRevisionsDto.prototype, "summary", void 0);
exports.QueryFlowRevisionsDto = QueryFlowRevisionsDto;
class QueryFlowPresetCatalogDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.WorkflowProfile,
        description: '按 profile 过滤；产品创建固定 shared 时可省略',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowProfile),
    __metadata("design:type", String)
], QueryFlowPresetCatalogDto.prototype, "profile", void 0);
exports.QueryFlowPresetCatalogDto = QueryFlowPresetCatalogDto;
class AllocateWorkflowIntentStateKeysDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [String],
        example: ['可回答', '需变更', '可回答'],
        description: '运营填写的状态名称；同批冲突自动加 _2/_3',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AllocateWorkflowIntentStateKeysDto.prototype, "labels", void 0);
exports.AllocateWorkflowIntentStateKeysDto = AllocateWorkflowIntentStateKeysDto;
class QueryFlowDto extends pagination_1.PaginationQueryDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryFlowDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkflowProfile }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowProfile),
    __metadata("design:type", String)
], QueryFlowDto.prototype, "profile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], QueryFlowDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryFlowDto.prototype, "keyword", void 0);
exports.QueryFlowDto = QueryFlowDto;
class MigrateFlowFromWorkflowDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '目标 flowKey；默认沿用 workflow.workflowKey',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], MigrateFlowFromWorkflowDto.prototype, "flowKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '将引用该 Workflow 的 Skill / PageAction 改绑到新 Flow',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MigrateFlowFromWorkflowDto.prototype, "rebindBindings", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '迁移成功后将源 Workflow.isActive=false',
        default: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MigrateFlowFromWorkflowDto.prototype, "deactivateSource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], MigrateFlowFromWorkflowDto.prototype, "changeNote", void 0);
exports.MigrateFlowFromWorkflowDto = MigrateFlowFromWorkflowDto;
//# sourceMappingURL=flow.dto.js.map