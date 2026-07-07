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
exports.ReplaceSkillToolsDto = exports.SkillToolBindingItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class SkillToolBindingItemDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tool ID（须已绑定到该 Agent）', example: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SkillToolBindingItemDto.prototype, "toolId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '是否为 Skill 激活 gate 的必选工具',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkillToolBindingItemDto.prototype, "isRequired", void 0);
exports.SkillToolBindingItemDto = SkillToolBindingItemDto;
class ReplaceSkillToolsDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Skill 关联工具列表（全量替换；须为 Agent 已绑定的 Tool）',
        type: [SkillToolBindingItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SkillToolBindingItemDto),
    __metadata("design:type", Array)
], ReplaceSkillToolsDto.prototype, "tools", void 0);
exports.ReplaceSkillToolsDto = ReplaceSkillToolsDto;
//# sourceMappingURL=skill-tool-binding.dto.js.map