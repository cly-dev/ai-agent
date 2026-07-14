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
exports.DraftReviewDecisionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const draft_review_1 = require("../../../core/draft-review");
class DraftReviewDecisionDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '草稿评审动作',
        enum: draft_review_1.DRAFT_REVIEW_ACTIONS,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...draft_review_1.DRAFT_REVIEW_ACTIONS]),
    __metadata("design:type", Object)
], DraftReviewDecisionDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '编辑后的 MessageBlocks 序列化串',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000000),
    __metadata("design:type", String)
], DraftReviewDecisionDto.prototype, "editedPreviewSerialized", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '覆盖写工具 arguments（浅 merge）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DraftReviewDecisionDto.prototype, "editedPendingWriteArguments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '重试时的补充说明',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], DraftReviewDecisionDto.prototype, "retryInstruction", void 0);
exports.DraftReviewDecisionDto = DraftReviewDecisionDto;
//# sourceMappingURL=draft-review-decision.dto.js.map