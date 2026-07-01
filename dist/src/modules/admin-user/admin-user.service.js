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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
let AdminUserService = class AdminUserService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    verifyPassword(plainPassword, storedPassword) {
        const [salt, hash] = storedPassword.split(':');
        if (!salt || !hash) {
            return false;
        }
        const hashBytes = Uint8Array.from(Buffer.from(hash, 'hex'));
        const plainHashBuffer = (0, crypto_1.scryptSync)(plainPassword, salt, hashBytes.length);
        const plainHashBytes = Uint8Array.from(plainHashBuffer);
        return (0, crypto_1.timingSafeEqual)(hashBytes, plainHashBytes);
    }
    sanitizeAdminUser(user) {
        const { password } = user, rest = __rest(user, ["password"]);
        return rest;
    }
    toExternalProfile(user) {
        return {
            id: user.id,
            employeeId: String(user.id),
            email: user.email,
            username: user.username,
            nickName: user.username,
            role: user.role,
            active: user.isActive,
            mustChangePassword: user.mustChangePassword,
        };
    }
    async getProfileByUserId(userId) {
        const admin = await this.prisma.adminUser.findFirst({
            where: { id: userId, isActive: true },
        });
        if (!admin) {
            throw new common_1.UnauthorizedException('admin user not found or inactive');
        }
        return this.toExternalProfile(this.sanitizeAdminUser(admin));
    }
    async login(data) {
        var _a, _b;
        const email = (_a = data.email) === null || _a === void 0 ? void 0 : _a.trim();
        const password = (_b = data.password) === null || _b === void 0 ? void 0 : _b.trim();
        if (!email || !password) {
            throw new common_1.BadRequestException('email and password are required');
        }
        const admin = await this.prisma.adminUser.findFirst({
            where: { email, isActive: true },
        });
        if (!admin) {
            throw new common_1.UnauthorizedException('invalid email or password');
        }
        const verified = this.verifyPassword(password, admin.password);
        if (!verified) {
            throw new common_1.UnauthorizedException('invalid email or password');
        }
        const payload = {
            sub: admin.id,
            email: admin.email,
            username: admin.username,
            adminRole: admin.role,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
            accessToken,
            user: this.sanitizeAdminUser(admin),
            mustChangePassword: admin.mustChangePassword,
        };
    }
};
AdminUserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AdminUserService);
exports.AdminUserService = AdminUserService;
//# sourceMappingURL=admin-user.service.js.map