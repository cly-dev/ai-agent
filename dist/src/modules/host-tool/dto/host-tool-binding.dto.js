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
exports.ReplaceSkillHostToolsDto = exports.SkillHostToolBindingItemDto = exports.BindAgentHostToolsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
class BindAgentHostToolsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HostTool ID 列表', type: [Number] }),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Array)
], BindAgentHostToolsDto.prototype, "hostToolIds", void 0);
exports.BindAgentHostToolsDto = BindAgentHostToolsDto;
class SkillHostToolBindingItemDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HostTool ID（须已绑定到该 Agent）' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SkillHostToolBindingItemDto.prototype, "hostToolId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.HostToolSkillTrigger }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.HostToolSkillTrigger),
    __metadata("design:type", String)
], SkillHostToolBindingItemDto.prototype, "trigger", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '覆盖 HostTool.argsTemplate' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SkillHostToolBindingItemDto.prototype, "argsTemplate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SkillHostToolBindingItemDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Plan / mutation 是否必须执行该 Host Tool',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkillHostToolBindingItemDto.prototype, "isRequired", void 0);
exports.SkillHostToolBindingItemDto = SkillHostToolBindingItemDto;
class ReplaceSkillHostToolsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SkillHostToolBindingItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SkillHostToolBindingItemDto),
    __metadata("design:type", Array)
], ReplaceSkillHostToolsDto.prototype, "tools", void 0);
exports.ReplaceSkillHostToolsDto = ReplaceSkillHostToolsDto;
//# sourceMappingURL=host-tool-binding.dto.js.map