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
exports.TOOL_ORDER_BY_FIELDS = exports.QueryToolDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
const pagination_1 = require("../../../common/pagination");
const tool_list_filter_util_1 = require("../tool-list-filter.util");
const TOOL_ORDER_BY_FIELDS = [
    'id',
    'name',
    'createdAt',
    'updatedAt',
    'riskLevel',
    'path',
];
exports.TOOL_ORDER_BY_FIELDS = TOOL_ORDER_BY_FIELDS;
class QueryToolDto extends pagination_1.PaginationQueryDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具 ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryToolDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AppClient ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryToolDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '业务能力键 definitionKey（精确）',
        example: 'order.get.api.orders',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolDto.prototype, "definitionKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Integration ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryToolDto.prototype, "integrationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具分类 ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryToolDto.prototype, "toolCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '是否未归类（toolCategoryId 为 null）',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, tool_list_filter_util_1.parseOptionalBoolean)(value)),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryToolDto.prototype, "toolCategoryIdIsNull", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '名称（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '描述（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '路径（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '关键词：匹配 name / description / path',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryToolDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '风险等级', enum: client_1.ToolLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ToolLevel),
    __metadata("design:type", String)
], QueryToolDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'HTTP 方法', enum: client_1.HttpMethod }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.HttpMethod),
    __metadata("design:type", String)
], QueryToolDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, tool_list_filter_util_1.parseOptionalBoolean)(value)),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryToolDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序字段',
        enum: TOOL_ORDER_BY_FIELDS,
        default: 'id',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(TOOL_ORDER_BY_FIELDS),
    __metadata("design:type", String)
], QueryToolDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '排序方向', enum: ['asc', 'desc'], default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], QueryToolDto.prototype, "order", void 0);
exports.QueryToolDto = QueryToolDto;
//# sourceMappingURL=query-tool.dto.js.map