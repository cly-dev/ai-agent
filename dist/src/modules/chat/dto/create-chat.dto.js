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
exports.CreateChatDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const page_context_fields_dto_1 = require("./page-context-fields.dto");
const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'];
class CreateChatDto extends page_context_fields_dto_1.PageContextMessageFieldsDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '会话标题' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateChatDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '关联 Agent ID（须属于同一 AppClient），默认 1',
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateChatDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '第一条消息角色',
        enum: MESSAGE_ROLES,
        example: 'user',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...MESSAGE_ROLES]),
    __metadata("design:type", String)
], CreateChatDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '第一条消息文本内容' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(1000000),
    __metadata("design:type", String)
], CreateChatDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '第一条消息工具调用名称' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateChatDto.prototype, "toolName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '第一条消息工具入参 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateChatDto.prototype, "toolInput", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '第一条消息工具出参 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateChatDto.prototype, "toolOutput", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '指定 Agent Skill ID（来自 GET /agent/:agentId/skills/client）。传入后外层 Plan 固定进入该 Skill。',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateChatDto.prototype, "skillId", void 0);
exports.CreateChatDto = CreateChatDto;
//# sourceMappingURL=create-chat.dto.js.map