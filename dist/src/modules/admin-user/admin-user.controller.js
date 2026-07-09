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
const client_1 = require("../../../generated/prisma/client");
const admin_roles_decorator_1 = require("../../auth/admin-roles.decorator");
const admin_role_guard_1 = require("../../auth/admin-role.guard");
const auth_throttle_constants_1 = require("../../auth/auth-throttle.constants");
const admin_user_service_1 = require("./admin-user.service");
const admin_user_profile_dto_1 = require("./dto/admin-user-profile.dto");
const change_admin_password_dto_1 = require("./dto/change-admin-password.dto");
const create_admin_user_dto_1 = require("./dto/create-admin-user.dto");
const login_admin_user_dto_1 = require("./dto/login-admin-user.dto");
const query_admin_user_dto_1 = require("./dto/query-admin-user.dto");
const update_admin_user_dto_1 = require("./dto/update-admin-user.dto");
let AdminUserController = class AdminUserController {
    constructor(service) {
        this.service = service;
    }
    actor(req) {
        var _a, _b;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (userId == null) {
            throw new common_1.UnauthorizedException('missing admin user context');
        }
        return { userId, adminRole: (_b = req.user) === null || _b === void 0 ? void 0 : _b.adminRole };
    }
    login(body) {
        return this.service.login(body);
    }
    getMe(req) {
        return this.service.getProfileByUserId(this.actor(req).userId);
    }
    changePassword(req, body) {
        return this.service.changePassword(this.actor(req).userId, body);
    }
    findPage(req, query) {
        return this.service.findPage(query, this.actor(req).adminRole);
    }
    create(req, body) {
        return this.service.create(body, this.actor(req).adminRole);
    }
    findOne(req, id) {
        return this.service.findOne(id, this.actor(req).adminRole);
    }
    update(req, id, body) {
        const actor = this.actor(req);
        return this.service.update(id, body, actor);
    }
    resetPassword(req, id) {
        return this.service.resetPassword(id, this.actor(req).adminRole);
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
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
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
__decorate([
    (0, common_1.Post)('change-password'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: '修改当前管理员密码' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '修改成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_admin_password_dto_1.ChangeAdminPasswordDto]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: '分页查询管理员列表（仅 SUPER_ADMIN）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_admin_user_dto_1.QueryAdminUserDto]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "findPage", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: '创建管理员（仅 SUPER_ADMIN）',
        description: '返回一次性初始密码 generatedPassword，请私下发给同事。',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_admin_user_dto_1.CreateAdminUserDto]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.SUPER_ADMIN),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '查询管理员详情（仅 SUPER_ADMIN）' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.SUPER_ADMIN),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({ summary: '更新管理员（仅 SUPER_ADMIN）' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, update_admin_user_dto_1.UpdateAdminUserDto]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/reset-password'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, admin_roles_decorator_1.AdminRoles)(client_1.AdminRole.SUPER_ADMIN),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiOperation)({
        summary: '重置管理员密码（仅 SUPER_ADMIN）',
        description: '返回一次性新密码 generatedPassword。',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], AdminUserController.prototype, "resetPassword", null);
AdminUserController = __decorate([
    (0, swagger_1.ApiTags)('admin-user'),
    (0, common_1.Controller)('admin-user'),
    (0, common_1.UseGuards)(admin_role_guard_1.AdminRoleGuard),
    __metadata("design:paramtypes", [admin_user_service_1.AdminUserService])
], AdminUserController);
exports.AdminUserController = AdminUserController;
//# sourceMappingURL=admin-user.controller.js.map