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
exports.ImportToolsFromSwaggerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("../../../../generated/prisma/client");
function parseOptionalCsv(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value
            .flatMap((item) => String(item).split(','))
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}
class ImportToolsFromSwaggerDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'OpenAPI JSON 文档地址（与 swagger-tool-cli 的 --spec-url 一致）',
        example: 'https://api.example.com/v3/api-docs',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], ImportToolsFromSwaggerDto.prototype, "specUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '使用已有 Integration ID（与 autoIntegration 二选一）',
    }),
    (0, class_validator_1.ValidateIf)((dto) => !dto.autoIntegration),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ImportToolsFromSwaggerDto.prototype, "integrationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '自动按 spec servers[0] 创建/复用 Integration',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportToolsFromSwaggerDto.prototype, "autoIntegration", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'autoIntegration 时必填：Integration 所属 AppClient',
    }),
    (0, class_validator_1.ValidateIf)((dto) => dto.autoIntegration === true),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ImportToolsFromSwaggerDto.prototype, "appClientId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '导入后绑定到 Agent（可选，写入 agent_tools）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ImportToolsFromSwaggerDto.prototype, "agentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '自动 Integration 名称（默认 spec.info.title）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportToolsFromSwaggerDto.prototype, "integrationName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '自动 Integration baseUrl（默认 servers[0].url）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportToolsFromSwaggerDto.prototype, "integrationBaseUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '系统级 apiKey（写入 Integration）' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImportToolsFromSwaggerDto.prototype, "integrationApiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Integration 鉴权模式',
        enum: client_1.IntegrationAuthMode,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IntegrationAuthMode),
    __metadata("design:type", String)
], ImportToolsFromSwaggerDto.prototype, "integrationAuthMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '仅解析不写库（等同 CLI --dry-run）',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportToolsFromSwaggerDto.prototype, "dryRun", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '只导入指定 OpenAPI tag（逗号分隔或数组）',
        example: ['order-controller'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseOptionalCsv(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ImportToolsFromSwaggerDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '只导入指定操作，格式 METHOD:/path（逗号分隔或数组）',
        example: ['GET:/api/orders'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseOptionalCsv(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ImportToolsFromSwaggerDto.prototype, "ops", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'path 须包含任一子串（逗号分隔或数组）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseOptionalCsv(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ImportToolsFromSwaggerDto.prototype, "pathInclude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '排除 path 包含子串的接口（与默认 public/buyer 合并）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseOptionalCsv(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ImportToolsFromSwaggerDto.prototype, "pathExclude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '关闭默认 path 排除（public、buyer）',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportToolsFromSwaggerDto.prototype, "noDefaultPathExclude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '下载 spec 时跳过 TLS 证书校验',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === true || value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ImportToolsFromSwaggerDto.prototype, "insecure", void 0);
exports.ImportToolsFromSwaggerDto = ImportToolsFromSwaggerDto;
//# sourceMappingURL=import-tools-from-swagger.dto.js.map