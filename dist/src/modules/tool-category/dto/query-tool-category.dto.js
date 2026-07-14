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
exports.QueryToolCategoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const pagination_1 = require("../../../common/pagination");
const TOOL_CATEGORY_ORDER_BY_FIELDS = [
    'id',
    'label',
    'sortOrder',
    'createdAt',
    'updatedAt',
];
class QueryToolCategoryDto extends pagination_1.PaginationQueryDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '分类 ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryToolCategoryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '分类标签（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolCategoryDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '关键词：匹配 label / description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolCategoryDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序字段',
        enum: TOOL_CATEGORY_ORDER_BY_FIELDS,
        default: 'sortOrder',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(TOOL_CATEGORY_ORDER_BY_FIELDS),
    __metadata("design:type", String)
], QueryToolCategoryDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序方向',
        enum: ['asc', 'desc'],
        default: 'asc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], QueryToolCategoryDto.prototype, "order", void 0);
exports.QueryToolCategoryDto = QueryToolCategoryDto;
//# sourceMappingURL=query-tool-category.dto.js.map