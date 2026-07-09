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
exports.AdminRoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("../../generated/prisma/client");
const admin_roles_decorator_1 = require("./admin-roles.decorator");
const admin_url_path_util_1 = require("./admin-url-path.util");
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
let AdminRoleGuard = class AdminRoleGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.adminRoleWeight = {
            [client_1.AdminRole.VIEWER]: 1,
            [client_1.AdminRole.OPERATOR]: 2,
            [client_1.AdminRole.SUPER_ADMIN]: 3,
        };
    }
    canActivate(context) {
        if (context.getType() !== 'http') {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (!(0, admin_url_path_util_1.isUnderAdminUrlPath)(request) || (0, admin_url_path_util_1.isPublicAdminAuthRoute)(request)) {
            return true;
        }
        const explicitRoles = this.reflector.getAllAndOverride(admin_roles_decorator_1.ADMIN_ROLES_KEY, [context.getHandler(), context.getClass()]);
        const requiredRoles = explicitRoles && explicitRoles.length > 0
            ? explicitRoles
            : this.defaultRolesForMethod(request.method);
        const user = request.user;
        if (!(user === null || user === void 0 ? void 0 : user.adminRole)) {
            throw new common_1.UnauthorizedException('admin authentication required');
        }
        const userWeight = this.adminRoleWeight[user.adminRole];
        const minRequiredWeight = requiredRoles.reduce((currentMin, role) => Math.min(currentMin, this.adminRoleWeight[role]), Number.POSITIVE_INFINITY);
        if (userWeight < minRequiredWeight) {
            throw new common_1.ForbiddenException('insufficient admin permissions');
        }
        return true;
    }
    defaultRolesForMethod(method) {
        const normalized = (method !== null && method !== void 0 ? method : 'GET').toUpperCase();
        if (READ_METHODS.has(normalized)) {
            return [client_1.AdminRole.VIEWER];
        }
        return [client_1.AdminRole.OPERATOR];
    }
};
AdminRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AdminRoleGuard);
exports.AdminRoleGuard = AdminRoleGuard;
//# sourceMappingURL=admin-role.guard.js.map