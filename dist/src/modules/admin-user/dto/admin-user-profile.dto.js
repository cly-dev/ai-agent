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
exports.AdminUserProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("../../../../generated/prisma/client");
class AdminUserProfileDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: '管理员 ID' }),
    __metadata("design:type", Number)
], AdminUserProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '外部账号 employeeId（字符串化 id，供 AppClient authConfig mapping）',
    }),
    __metadata("design:type", String)
], AdminUserProfileDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminUserProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AdminUserProfileDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '昵称（与 username 相同）' }),
    __metadata("design:type", String)
], AdminUserProfileDto.prototype, "nickName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.AdminRole }),
    __metadata("design:type", String)
], AdminUserProfileDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '账号是否可用' }),
    __metadata("design:type", Boolean)
], AdminUserProfileDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], AdminUserProfileDto.prototype, "mustChangePassword", void 0);
exports.AdminUserProfileDto = AdminUserProfileDto;
//# sourceMappingURL=admin-user-profile.dto.js.map