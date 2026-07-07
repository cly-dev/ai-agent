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
exports.SaveMessageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const page_context_fields_dto_1 = require("../../chat/dto/page-context-fields.dto");
const draft_review_decision_dto_1 = require("./draft-review-decision.dto");
const MESSAGE_ROLES = ['user', 'assistant', 'tool', 'system'];
class SaveMessageDto extends page_context_fields_dto_1.PageContextMessageFieldsDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '关联 Agent ID（须属于同一 AppClient），默认 1',
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SaveMessageDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '角色',
        enum: MESSAGE_ROLES,
        example: 'user',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...MESSAGE_ROLES]),
    __metadata("design:type", String)
], SaveMessageDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '文本内容（JSON 请先 stringify）' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000000),
    __metadata("design:type", String)
], SaveMessageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'MessageTurn ID。role=assistant 时写入 outputMessageId；正常对话由 Agent run 收尾自动落库，前端一般无需传。',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SaveMessageDto.prototype, "turnId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具调用名称' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], SaveMessageDto.prototype, "toolName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具入参 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SaveMessageDto.prototype, "toolInput", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具出参 JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SaveMessageDto.prototype, "toolOutput", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '写确认门结构化决策（confirm / confirm_with_edits / retry / cancel）；优先于 confirmWrite / cancelWrite',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => draft_review_decision_dto_1.DraftReviewDecisionDto),
    __metadata("design:type", draft_review_decision_dto_1.DraftReviewDecisionDto)
], SaveMessageDto.prototype, "writeGate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '（已废弃）为 true 时确认并执行上一轮缓存的写操作；请改用 writeGate.action=confirm',
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], SaveMessageDto.prototype, "confirmWrite", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '（已废弃）为 true 时取消待确认写操作；请改用 writeGate.action=cancel',
        deprecated: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], SaveMessageDto.prototype, "cancelWrite", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '指定 Agent Skill ID（来自 GET /agent/:agentId/skills/client）。传入后外层 Plan 固定进入该 Skill，不再由 LLM 选择。',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SaveMessageDto.prototype, "skillId", void 0);
exports.SaveMessageDto = SaveMessageDto;
//# sourceMappingURL=save-message.dto.js.map