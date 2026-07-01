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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const auth_throttle_constants_1 = require("../../auth/auth-throttle.constants");
const admin_user_service_1 = require("./admin-user.service");
const admin_user_profile_dto_1 = require("./dto/admin-user-profile.dto");
const login_admin_user_dto_1 = require("./dto/login-admin-user.dto");
let AdminUserController = class AdminUserController {
    constructor(service) {
        this.service = service;
    }
    login(body) {
        return this.service.login(body);
    }
    getMe(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (userId == null) {
            throw new common_1.UnauthorizedException('missing admin user context');
        }
        return this.service.getProfileByUserId(userId);
    }
};
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)(auth_throttle_constants_1.AUTH_THROTTLE_LIMIT, auth_throttle_constants_1.AUTH_THROTTLE_TTL_SECONDS),
    (0, swagger_1.ApiOperation)({ summary: '管理员登录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '登录成功并返回 JWT Token' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '邮箱或密码错误' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_admin_user_dto_1.LoginAdminUserDto]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: '获取当前登录管理员信息',
        description: '需 `Authorization: Bearer <管理员 JWT>`。AppClient `http_profile` 鉴权可将本接口作为 profilePath（见 app-client id=2 配置）。',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: admin_user_profile_dto_1.AdminUserProfileDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token 无效或管理员不可用' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "getMe", null);
AdminUserController = __decorate([
    (0, swagger_1.ApiTags)('admin-user'),
    (0, common_1.Controller)('admin-user'),
    __metadata("design:paramtypes", [admin_user_service_1.AdminUserService])
], AdminUserController);
exports.AdminUserController = AdminUserController;
//# sourceMappingURL=admin-user.controller.js.map