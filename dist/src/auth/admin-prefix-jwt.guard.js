"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPrefixJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const admin_url_path_util_1 = require("./admin-url-path.util");
let AdminPrefixJwtGuard = class AdminPrefixJwtGuard extends (0, passport_1.AuthGuard)('jwt') {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        if (!(0, admin_url_path_util_1.isUnderAdminUrlPath)(request) || (0, admin_url_path_util_1.isPublicAdminAuthRoute)(request)) {
            return true;
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info, context) {
        const request = context.switchToHttp().getRequest();
        if (!(0, admin_url_path_util_1.isUnderAdminUrlPath)(request) || (0, admin_url_path_util_1.isPublicAdminAuthRoute)(request)) {
            return user;
        }
        const resolved = super.handleRequest(err, user, info, context);
        if (resolved.adminRole === undefined) {
            throw new common_1.ForbiddenException('administrator access required');
        }
        return resolved;
    }
};
AdminPrefixJwtGuard = __decorate([
    (0, common_1.Injectable)()
], AdminPrefixJwtGuard);
exports.AdminPrefixJwtGuard = AdminPrefixJwtGuard;
//# sourceMappingURL=admin-prefix-jwt.guard.js.map