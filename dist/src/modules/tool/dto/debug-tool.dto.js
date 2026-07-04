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
exports.DebugToolDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class DebugToolDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '请求参数：用于 path 占位符、OpenAPI query/header 参数及 JSON body（与 Agent 调用 tool 时 input 一致）',
        example: { orderId: '10001', page: 1 },
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DebugToolDto.prototype, "parameters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '自定义请求头；同名键会覆盖默认头（含 Authorization）',
        example: { 'X-Tenant-Id': 'demo', Authorization: 'Bearer debug-token' },
        type: Object,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DebugToolDto.prototype, "headers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '调试时临时覆盖 Integration 系统 apiKey（未传则使用库中配置）',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DebugToolDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '本次调试超时（毫秒）；未传则使用工具 timeout 或默认 10000',
        example: 10000,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DebugToolDto.prototype, "timeoutMs", void 0);
exports.DebugToolDto = DebugToolDto;
//# sourceMappingURL=debug-tool.dto.js.map