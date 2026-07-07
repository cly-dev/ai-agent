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
exports.AGENT_TOOL_ORDER_BY_FIELDS = exports.QueryAgentToolsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
const pagination_1 = require("../../../common/pagination");
const tool_list_filter_util_1 = require("../../tool/tool-list-filter.util");
const AGENT_TOOL_ORDER_BY_FIELDS = [
    'toolId',
    'id',
    'name',
    'createdAt',
    'updatedAt',
    'riskLevel',
    'path',
];
exports.AGENT_TOOL_ORDER_BY_FIELDS = AGENT_TOOL_ORDER_BY_FIELDS;
class QueryAgentToolsDto extends pagination_1.PaginationQueryDto {
    resolveOrder() {
        var _a, _b;
        return {
            orderBy: (_a = this.orderBy) !== null && _a !== void 0 ? _a : 'toolId',
            order: ((_b = this.order) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'desc' ? 'desc' : 'asc',
        };
    }
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tool ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentToolsDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '业务能力键 definitionKey（精确）',
        example: 'order.get.api.orders',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "definitionKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Integration ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentToolsDto.prototype, "integrationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具分类 ID（精确）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAgentToolsDto.prototype, "toolCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '是否未归类（toolCategoryId 为 null）',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, tool_list_filter_util_1.parseOptionalBoolean)(value)),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryAgentToolsDto.prototype, "toolCategoryIdIsNull", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '名称（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '描述（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '路径（模糊，忽略大小写）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '关键词：匹配 name / description / path',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '风险等级', enum: client_1.ToolLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ToolLevel),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'HTTP 方法', enum: client_1.HttpMethod }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.HttpMethod),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, tool_list_filter_util_1.parseOptionalBoolean)(value)),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryAgentToolsDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序字段（toolId/id 为绑定表字段，其余为 Tool 字段）',
        enum: AGENT_TOOL_ORDER_BY_FIELDS,
        default: 'toolId',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(AGENT_TOOL_ORDER_BY_FIELDS),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "orderBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排序方向 asc / desc',
        enum: ['asc', 'desc'],
        default: 'asc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    __metadata("design:type", String)
], QueryAgentToolsDto.prototype, "order", void 0);
exports.QueryAgentToolsDto = QueryAgentToolsDto;
//# sourceMappingURL=query-agent-tools.dto.js.map