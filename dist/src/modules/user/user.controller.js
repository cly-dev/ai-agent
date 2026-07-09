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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const user_jwt_auth_guard_1 = require("../../auth/user-jwt-auth.guard");
const auth_throttle_constants_1 = require("../../auth/auth-throttle.constants");
const user_service_1 = require("./user.service");
const login_user_dto_1 = require("./dto/login-user.dto");
let UserController = class UserController {
    constructor(service) {
        this.service = service;
    }
    login(body) {
        return this.service.login(body);
    }
    getPasswordReminder(req) {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            throw new common_1.UnauthorizedException('invalid user token');
        }
        return this.service.getPasswordReminder(userId);
    }
};
__decorate([
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)(auth_throttle_constants_1.AUTH_THROTTLE_LIMIT, auth_throttle_constants_1.AUTH_THROTTLE_TTL_SECONDS),
    (0, swagger_1.ApiOperation)({ summary: '业务用户登录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '登录成功并返回 JWT Token' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '邮箱或密码错误' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_user_dto_1.LoginUserDto]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(user_jwt_auth_guard_1.UserJwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: '检查是否需要首次修改密码（业务用户 Token）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回密码提醒状态' }),
    (0, common_1.Get)('password-reminder'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "getPasswordReminder", null);
UserController = __decorate([
    (0, swagger_1.ApiTags)('user'),
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UserController);
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map