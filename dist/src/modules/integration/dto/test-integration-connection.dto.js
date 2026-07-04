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
exports.TestIntegrationConnectionByUrlDto = exports.TestIntegrationConnectionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class TestIntegrationConnectionDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '覆盖库中的 baseUrl；创建前探测时必填',
        example: 'https://api.example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }, { message: 'baseUrl must be a valid http(s) URL' }),
    __metadata("design:type", String)
], TestIntegrationConnectionDto.prototype, "baseUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '覆盖库中的系统 apiKey，用于带 Authorization 探测',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestIntegrationConnectionDto.prototype, "apiKey", void 0);
exports.TestIntegrationConnectionDto = TestIntegrationConnectionDto;
class TestIntegrationConnectionByUrlDto extends TestIntegrationConnectionDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '待探测的 API 根地址',
        example: 'https://api.example.com',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUrl)({ require_protocol: true }, { message: 'baseUrl must be a valid http(s) URL' }),
    __metadata("design:type", String)
], TestIntegrationConnectionByUrlDto.prototype, "baseUrl", void 0);
exports.TestIntegrationConnectionByUrlDto = TestIntegrationConnectionByUrlDto;
//# sourceMappingURL=test-integration-connection.dto.js.map