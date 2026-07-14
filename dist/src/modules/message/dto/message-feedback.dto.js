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
exports.QuerySessionMessageFeedbacksDto = exports.UpsertMessageFeedbackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const FEEDBACK_RATINGS = ['up', 'down'];
class UpsertMessageFeedbackDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ enum: FEEDBACK_RATINGS, description: '赞或踩' }),
    (0, class_validator_1.IsIn)([...FEEDBACK_RATINGS]),
    __metadata("design:type", Object)
], UpsertMessageFeedbackDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '点踩原因标签 key 列表（见 GET /chat/feedback/down-reason-tags）；点踩时须至少选一个标签或填写 comment',
        type: [String],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(8),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(64, { each: true }),
    __metadata("design:type", Array)
], UpsertMessageFeedbackDto.prototype, "reasonTags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '点踩补充说明；选 other 标签时必填',
        maxLength: 2000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpsertMessageFeedbackDto.prototype, "comment", void 0);
exports.UpsertMessageFeedbackDto = UpsertMessageFeedbackDto;
class QuerySessionMessageFeedbacksDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'assistant 消息 ID 列表，逗号分隔',
        example: '12,15,18',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySessionMessageFeedbacksDto.prototype, "messageIds", void 0);
exports.QuerySessionMessageFeedbacksDto = QuerySessionMessageFeedbacksDto;
//# sourceMappingURL=message-feedback.dto.js.map