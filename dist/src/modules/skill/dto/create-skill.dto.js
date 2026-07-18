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
exports.CreateSkillDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
const skill_tool_binding_dto_1 = require("./skill-tool-binding.dto");
class CreateSkillDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Skill 名称（同一 Agent 内唯一）', example: '订单查询' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '命中后注入 LLM 的业务指引文案' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "prompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '能力键（同一 Agent 内唯一，可选）',
        example: 'order.inquiry',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "capabilityKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '描述' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '扩展配置 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSkillDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '风险等级；未传则按关联 Tool 的最高 riskLevel 推断。L2/L3 表示含写操作，运行前需用户确认。',
        enum: client_1.ToolLevel,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ToolLevel),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSkillDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '初始关联工具（须为 Agent 已绑定的 Tool）',
        type: [skill_tool_binding_dto_1.SkillToolBindingItemDto],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => skill_tool_binding_dto_1.SkillToolBindingItemDto),
    __metadata("design:type", Array)
], CreateSkillDto.prototype, "tools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '【已移除】禁止新绑；请用 flowId。存量仅可读，迁移见 POST /admin/flow/migrate-from-workflow/:id',
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSkillDto.prototype, "workflowId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '【已移除】随 workflowId 废弃',
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSkillDto.prototype, "workflowVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '引用的 Flow 资产 ID（Intent/IR；编排唯一绑定）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSkillDto.prototype, "flowId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'pin Flow revision version' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSkillDto.prototype, "flowVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '按 nodeId 覆盖 objective 等字段' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSkillDto.prototype, "workflowOverrides", void 0);
exports.CreateSkillDto = CreateSkillDto;
//# sourceMappingURL=create-skill.dto.js.map