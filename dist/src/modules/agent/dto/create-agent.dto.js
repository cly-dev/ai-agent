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
exports.CreateAgentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateAgentDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属 AppClient ID', example: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAgentDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Agent 名称', example: 'Sales Assistant' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '系统提示词' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "systemPrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Agent 描述' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAgentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '允许调用的工具 ID 列表', type: [Number] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], CreateAgentDto.prototype, "toolIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '最大执行步数', example: 8 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateAgentDto.prototype, "maxSteps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用工具调用', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAgentDto.prototype, "enableToolCall", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '收紧 HTTP Tool 为 AgentTool 白名单' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAgentDto.prototype, "restrictTools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '收紧 Host Tool 为 AgentHostTool 白名单' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAgentDto.prototype, "restrictHostTools", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '收紧 Skill 为 AgentSkill 白名单' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAgentDto.prototype, "restrictSkills", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '自定义配置 JSON',
        example: { temperature: 0.2 },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAgentDto.prototype, "config", void 0);
exports.CreateAgentDto = CreateAgentDto;
//# sourceMappingURL=create-agent.dto.js.map