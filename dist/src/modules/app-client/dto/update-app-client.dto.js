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
exports.UpdateAppClientDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateAppClientDto {
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '业务系统名称', example: 'crm-system' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppClientDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '业务系统描述',
        example: 'CRM business application',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAppClientDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAppClientDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '外部账号鉴权配置（JSON）。传 null 可清空并回退 APP_CLIENT_HOST 环境变量。',
        example: {
            provider: 'http_profile',
            http: {
                baseUrl: 'https://admin.example.com',
                profilePath: '/account/seller/account/current',
                method: 'GET',
                tokenPlacement: 'authorization_bearer',
                mapping: {
                    employeeId: 'employeeId',
                    email: 'email',
                    username: 'nickName',
                    nickName: 'nickName',
                    cnName: 'cnName',
                    active: 'active',
                },
            },
            autoBindRoleName: 'operator',
            propagateTokenToIntegrations: true,
        },
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateAppClientDto.prototype, "authConfig", void 0);
exports.UpdateAppClientDto = UpdateAppClientDto;
//# sourceMappingURL=update-app-client.dto.js.map