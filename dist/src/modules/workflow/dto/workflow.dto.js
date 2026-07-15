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
exports.WorkflowOverridesDto = exports.QueryWorkflowDto = exports.QueryWorkflowRevisionsDto = exports.UpdateWorkflowDto = exports.CreateWorkflowDto = exports.WorkflowHostToolBindingDto = exports.WorkflowToolBindingDto = exports.WORKFLOW_PRESET_KIND_VALUES = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
const pagination_1 = require("../../../common/pagination");
exports.WORKFLOW_PRESET_KIND_VALUES = [
    'page_auto_fill',
    'page_context_push',
    'fetch_push_summarize',
    'fetch_and_answer',
    'mutation_submit',
    'page_context_mutation_submit',
];
class WorkflowToolBindingDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WorkflowToolBindingDto.prototype, "toolId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], WorkflowToolBindingDto.prototype, "isRequired", void 0);
exports.WorkflowToolBindingDto = WorkflowToolBindingDto;
class WorkflowHostToolBindingDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], WorkflowHostToolBindingDto.prototype, "hostToolId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], WorkflowHostToolBindingDto.prototype, "isRequired", void 0);
exports.WorkflowHostToolBindingDto = WorkflowHostToolBindingDto;
class CreateWorkflowDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateWorkflowDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'campaign.auto_fill' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "workflowKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "goal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.WorkflowProfile }),
    (0, class_validator_1.IsEnum)(client_1.WorkflowProfile),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "profile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkflowDeliverable, default: client_1.WorkflowDeliverable.answer }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowDeliverable),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "deliverable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: exports.WORKFLOW_PRESET_KIND_VALUES,
        description: '场景 Preset：与 presetConfig 一起使用时，服务端展开为 nodes[] 再保存；与 nodes 互斥',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...exports.WORKFLOW_PRESET_KIND_VALUES]),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "preset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Preset 参数：如 hostToolId / readToolId / writeToolId / objectives 等，见 GET /workflow/presets/catalog',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset != null),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateWorkflowDto.prototype, "presetConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'B 端须传文档对象 { nodes, edges, entryNodeId? }（与 preset 二选一）。线性流程也必须传 edges（节点间 always 边）；线索分支用 clue/default。禁止仅传 nodes[]',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset == null),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateWorkflowDto.prototype, "nodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateWorkflowDto.prototype, "constraints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateWorkflowDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateWorkflowDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [WorkflowToolBindingDto],
        description: '可选。仅用于为 nodes[].input.toolIds/toolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkflowToolBindingDto),
    __metadata("design:type", Array)
], CreateWorkflowDto.prototype, "tools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [WorkflowHostToolBindingDto],
        description: '可选。仅用于为 nodes[].input.hostToolIds/hostToolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkflowHostToolBindingDto),
    __metadata("design:type", Array)
], CreateWorkflowDto.prototype, "hostTools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '首版 revision 备注' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "changeNote", void 0);
exports.CreateWorkflowDto = CreateWorkflowDto;
class UpdateWorkflowDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "goal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkflowDeliverable }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowDeliverable),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "deliverable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: exports.WORKFLOW_PRESET_KIND_VALUES,
        description: '场景 Preset：与 presetConfig 一起使用时重新展开 nodes[]',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...exports.WORKFLOW_PRESET_KIND_VALUES]),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "preset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Preset 参数' }),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset != null),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateWorkflowDto.prototype, "presetConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '更新 nodes 会递增 version 并写 revision；B 端须传 { nodes, edges, entryNodeId? }（线性也须 always 边）；与 preset 二选一',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.preset == null),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateWorkflowDto.prototype, "nodes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateWorkflowDto.prototype, "constraints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateWorkflowDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateWorkflowDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [WorkflowToolBindingDto],
        description: '可选。仅用于为 nodes[].input.toolIds/toolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkflowToolBindingDto),
    __metadata("design:type", Array)
], UpdateWorkflowDto.prototype, "tools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [WorkflowHostToolBindingDto],
        description: '可选。仅用于为 nodes[].input.hostToolIds/hostToolId 覆盖 isRequired；绑定 ID 必须在节点 input 上声明，省略则自动从 nodes 推导',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkflowHostToolBindingDto),
    __metadata("design:type", Array)
], UpdateWorkflowDto.prototype, "hostTools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateWorkflowDto.prototype, "changeNote", void 0);
exports.UpdateWorkflowDto = UpdateWorkflowDto;
class QueryWorkflowRevisionsDto {
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
], QueryWorkflowRevisionsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'true 时仅返回版本元数据（version / changeNote / isCurrent），不含 nodes 快照',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryWorkflowRevisionsDto.prototype, "summary", void 0);
exports.QueryWorkflowRevisionsDto = QueryWorkflowRevisionsDto;
class QueryWorkflowDto extends pagination_1.PaginationQueryDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QueryWorkflowDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.WorkflowProfile }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.WorkflowProfile),
    __metadata("design:type", String)
], QueryWorkflowDto.prototype, "profile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryWorkflowDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryWorkflowDto.prototype, "keyword", void 0);
exports.QueryWorkflowDto = QueryWorkflowDto;
class WorkflowOverridesDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '按 nodeId 覆盖 objective' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], WorkflowOverridesDto.prototype, "overrides", void 0);
exports.WorkflowOverridesDto = WorkflowOverridesDto;
//# sourceMappingURL=workflow.dto.js.map