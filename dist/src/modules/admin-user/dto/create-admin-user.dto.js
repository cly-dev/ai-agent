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
exports.CreateAdminUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../../generated/prisma/client");
const class_validator_1 = require("class-validator");
class CreateAdminUserDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员邮箱', example: 'ops@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员用户名', example: 'ops-admin' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员角色', enum: client_1.AdminRole }),
    (0, class_validator_1.IsEnum)(client_1.AdminRole),
    __metadata("design:type", String)
], CreateAdminUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '是否启用', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAdminUserDto.prototype, "isActive", void 0);
exports.CreateAdminUserDto = CreateAdminUserDto;
//# sourceMappingURL=create-admin-user.dto.js.map