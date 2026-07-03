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
exports.WriteDraftPublicDto = exports.WriteDraftProvenancePublicDto = exports.WriteDraftPresentationPublicDto = exports.WriteDraftToolPublicDto = exports.MessageBlockDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class MessageBlockDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'text' }),
    __metadata("design:type", String)
], MessageBlockDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '预览正文' }),
    __metadata("design:type", String)
], MessageBlockDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['markdown', 'plain', 'html'] }),
    __metadata("design:type", String)
], MessageBlockDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MessageBlockDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MessageBlockDto.prototype, "language", void 0);
exports.MessageBlockDto = MessageBlockDto;
class WriteDraftToolPublicDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'submit_review' }),
    __metadata("design:type", String)
], WriteDraftToolPublicDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 42 }),
    __metadata("design:type", Number)
], WriteDraftToolPublicDto.prototype, "toolId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'L2' }),
    __metadata("design:type", String)
], WriteDraftToolPublicDto.prototype, "riskLevel", void 0);
exports.WriteDraftToolPublicDto = WriteDraftToolPublicDto;
class WriteDraftPresentationPublicDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true, example: '即将提交评价回复' }),
    __metadata("design:type", String)
], WriteDraftPresentationPublicDto.prototype, "summaryText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MessageBlockDto] }),
    __metadata("design:type", Array)
], WriteDraftPresentationPublicDto.prototype, "previewBlocks", void 0);
exports.WriteDraftPresentationPublicDto = WriteDraftPresentationPublicDto;
class WriteDraftProvenancePublicDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0 }),
    __metadata("design:type", Number)
], WriteDraftProvenancePublicDto.prototype, "draftRetryCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], WriteDraftProvenancePublicDto.prototype, "draftRetryMax", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], WriteDraftProvenancePublicDto.prototype, "canRetry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-03T03:00:00.000Z' }),
    __metadata("design:type", String)
], WriteDraftProvenancePublicDto.prototype, "composedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['composed', 'suspended', 'user_edit', 'retry'],
        example: 'suspended',
    }),
    __metadata("design:type", String)
], WriteDraftProvenancePublicDto.prototype, "lastEvent", void 0);
exports.WriteDraftProvenancePublicDto = WriteDraftProvenancePublicDto;
class WriteDraftPublicDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], WriteDraftPublicDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: WriteDraftToolPublicDto }),
    __metadata("design:type", WriteDraftToolPublicDto)
], WriteDraftPublicDto.prototype, "tool", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: 'object',
        additionalProperties: true,
        example: { content: '生成的正文' },
        description: '写 HTTP 执行真值',
    }),
    __metadata("design:type", Object)
], WriteDraftPublicDto.prototype, "arguments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: WriteDraftPresentationPublicDto }),
    __metadata("design:type", WriteDraftPresentationPublicDto)
], WriteDraftPublicDto.prototype, "presentation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: WriteDraftProvenancePublicDto }),
    __metadata("design:type", WriteDraftProvenancePublicDto)
], WriteDraftPublicDto.prototype, "provenance", void 0);
exports.WriteDraftPublicDto = WriteDraftPublicDto;
//# sourceMappingURL=write-draft-public.dto.js.map