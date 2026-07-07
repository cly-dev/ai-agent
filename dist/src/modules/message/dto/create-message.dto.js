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
exports.CreateMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'];
class CreateMessageDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属会话 ID（32 位 hex）' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-f0-9]{32}$/),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '角色',
        enum: MESSAGE_ROLES,
        example: 'user',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...MESSAGE_ROLES]),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '文本内容' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000000),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具调用名称' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateMessageDto.prototype, "toolName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具入参 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMessageDto.prototype, "toolInput", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具出参 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMessageDto.prototype, "toolOutput", void 0);
exports.CreateMessageDto = CreateMessageDto;
//# sourceMappingURL=create-message.dto.js.map