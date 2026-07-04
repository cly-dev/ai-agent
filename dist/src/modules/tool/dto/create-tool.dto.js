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
exports.CreateToolDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
class CreateToolDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所属 AppClient ID', example: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateToolDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '工具名称（唯一标识，供 LLM tool_call）', example: 'getOrderList' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateToolDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '业务能力键：同一 AppClient 内唯一，用于跨系统对齐；未传则按类目/method/path/name 自动生成',
        example: 'order.get.getOrderList',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateToolDto.prototype, "definitionKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '工具描述' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateToolDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '风险等级', enum: client_1.ToolLevel, default: client_1.ToolLevel.L1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ToolLevel),
    __metadata("design:type", String)
], CreateToolDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'OpenAPI / JSON Schema 参数结构' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateToolDto.prototype, "schema", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'LangChain inputSchema' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateToolDto.prototype, "inputSchema", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'outputSchema' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateToolDto.prototype, "outputSchema", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '工具响应裁剪配置：coreFields（核心字段）/ optionalFields（按用户问题追加）/ arrayLimits / listPath',
        example: {
            coreFields: [
                { path: 'id', label: '商品ID', description: '商品唯一标识' },
                { path: 'title', label: '标题', description: '商品标题' },
                {
                    path: 'status',
                    label: '状态',
                    description: '商品上架状态',
                    enumLabels: { '1': '草稿', '2': '上架' },
                },
            ],
            optionalFields: [
                {
                    path: 'seoList',
                    label: 'SEO配置',
                    description: 'SEO 标题与关键词列表',
                    keywords: ['seo', '搜索', '关键词'],
                },
            ],
            arrayLimits: { list: 100 },
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateToolDto.prototype, "responseProfile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Agent 选工具元数据：mode / resource / operation / businessFields / aliases / examples / priority。paramFormatHints 无需填写，保存时从 inputSchema.parameters（及 requestBody）的 description/format/enum 自动推导。',
        example: {
            mode: 'READ',
            resource: 'PRODUCT',
            operation: 'DETAIL',
            businessFields: ['productId'],
            aliases: ['商品详情'],
            examples: [],
            priority: 100,
            isMutation: false,
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateToolDto.prototype, "agentMetadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HTTP 方法', enum: client_1.HttpMethod }),
    (0, class_validator_1.IsEnum)(client_1.HttpMethod),
    __metadata("design:type", String)
], CreateToolDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'API 路径', example: '/api/orders' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateToolDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '关联 Integration ID', example: 1 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateToolDto.prototype, "integrationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '工具分类 ID', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateToolDto.prototype, "toolCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateToolDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '超时毫秒数', example: 10000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateToolDto.prototype, "timeout", void 0);
exports.CreateToolDto = CreateToolDto;
//# sourceMappingURL=create-tool.dto.js.map