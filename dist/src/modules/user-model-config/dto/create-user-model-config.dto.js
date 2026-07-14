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
exports.CreateUserModelConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateUserModelConfigDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属用户 ID', example: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateUserModelConfigDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型提供商', example: 'openai' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserModelConfigDto.prototype, "provider", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型名称', example: 'gpt-4o-mini' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserModelConfigDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '模型访问密钥', example: 'sk-xxx' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateUserModelConfigDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '自定义模型网关地址',
        example: 'https://api.openai.com/v1',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateUserModelConfigDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '采样温度', example: 0.7 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateUserModelConfigDto.prototype, "temperature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '最大 token 数', example: 2048 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateUserModelConfigDto.prototype, "maxTokens", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用该配置', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateUserModelConfigDto.prototype, "enabled", void 0);
exports.CreateUserModelConfigDto = CreateUserModelConfigDto;
//# sourceMappingURL=create-user-model-config.dto.js.map