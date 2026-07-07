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
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const prisma_service_1 = require("../../prisma/prisma.service");
const admin_user_mapper_1 = require("./admin-user.mapper");
let AdminUserService = class AdminUserService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    hashPassword(password) {
        const salt = (0, crypto_1.randomBytes)(16).toString('hex');
        const hash = (0, crypto_1.scryptSync)(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }
    generateInitialPassword() {
        return (0, crypto_1.randomBytes)(12).toString('hex');
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
    assertSuperAdmin(actorRole) {
        if (actorRole !== client_1.AdminRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('SUPER_ADMIN required');
        }
    }
    async assertLastSuperAdminPreserved(input) {
        const user = await this.prisma.adminUser.findUnique({
            where: { id: input.targetUserId },
            select: { role: true, isActive: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('admin user not found');
        }
        const wasActiveSuperAdmin = user.role === client_1.AdminRole.SUPER_ADMIN && user.isActive;
        const willRemainActiveSuperAdmin = input.nextRole === client_1.AdminRole.SUPER_ADMIN && input.nextIsActive;
        if (!wasActiveSuperAdmin || willRemainActiveSuperAdmin) {
            return;
        }
        const remaining = await this.prisma.adminUser.count({
            where: {
                role: client_1.AdminRole.SUPER_ADMIN,
                isActive: true,
                NOT: { id: input.targetUserId },
            },
        });
        if (remaining < 1) {
            throw new common_1.BadRequestException('cannot remove or disable the last active SUPER_ADMIN');
        }
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
    async create(dto, actorRole) {
        var _a;
        this.assertSuperAdmin(actorRole);
        const email = dto.email.trim();
        const username = dto.username.trim();
        if (!email || !username) {
            throw new common_1.BadRequestException('email and username are required');
        }
        const generatedPassword = this.generateInitialPassword();
        try {
            const row = await this.prisma.adminUser.create({
                data: {
                    email,
                    username,
                    role: dto.role,
                    isActive: (_a = dto.isActive) !== null && _a !== void 0 ? _a : true,
                    mustChangePassword: true,
                    password: this.hashPassword(generatedPassword),
                },
            });
            return {
                admin: (0, admin_user_mapper_1.toAdminUserResponse)(this.sanitizeAdminUser(row)),
                generatedPassword,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('admin email already exists');
            }
            throw error;
        }
    }
    async findPage(query, actorRole) {
        this.assertSuperAdmin(actorRole);
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = this.buildWhere(query);
        const orderBy = this.buildOrderBy(query.orderBy, query.order);
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.adminUser.findMany({
                where,
                orderBy,
                skip,
                take,
            }),
            this.prisma.adminUser.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map((row) => (0, admin_user_mapper_1.toAdminUserResponse)(this.sanitizeAdminUser(row))), total, page, pageSize);
    }
    async findOne(id, actorRole) {
        this.assertSuperAdmin(actorRole);
        const row = await this.prisma.adminUser.findUnique({ where: { id } });
        if (!row) {
            throw new common_1.NotFoundException(`admin user ${id} not found`);
        }
        return (0, admin_user_mapper_1.toAdminUserResponse)(this.sanitizeAdminUser(row));
    }
    async update(id, dto, actor) {
        var _a, _b;
        this.assertSuperAdmin(actor.adminRole);
        const existing = await this.prisma.adminUser.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`admin user ${id} not found`);
        }
        if (dto.isActive === false && actor.userId === id) {
            throw new common_1.BadRequestException('cannot disable your own admin account');
        }
        const nextRole = (_a = dto.role) !== null && _a !== void 0 ? _a : existing.role;
        const nextIsActive = (_b = dto.isActive) !== null && _b !== void 0 ? _b : existing.isActive;
        await this.assertLastSuperAdminPreserved({
            targetUserId: id,
            nextRole,
            nextIsActive,
        });
        const data = {};
        if (dto.email !== undefined) {
            data.email = dto.email.trim();
        }
        if (dto.username !== undefined) {
            data.username = dto.username.trim();
        }
        if (dto.role !== undefined) {
            data.role = dto.role;
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        try {
            const row = await this.prisma.adminUser.update({
                where: { id },
                data,
            });
            return (0, admin_user_mapper_1.toAdminUserResponse)(this.sanitizeAdminUser(row));
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('admin email already exists');
            }
            throw error;
        }
    }
    async resetPassword(id, actorRole) {
        this.assertSuperAdmin(actorRole);
        const existing = await this.prisma.adminUser.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`admin user ${id} not found`);
        }
        const generatedPassword = this.generateInitialPassword();
        const row = await this.prisma.adminUser.update({
            where: { id },
            data: {
                password: this.hashPassword(generatedPassword),
                mustChangePassword: true,
            },
        });
        return {
            admin: (0, admin_user_mapper_1.toAdminUserResponse)(this.sanitizeAdminUser(row)),
            generatedPassword,
        };
    }
    async changePassword(userId, dto) {
        const currentPassword = dto.currentPassword.trim();
        const newPassword = dto.newPassword.trim();
        if (!currentPassword || !newPassword) {
            throw new common_1.BadRequestException('currentPassword and newPassword are required');
        }
        const admin = await this.prisma.adminUser.findUnique({
            where: { id: userId },
        });
        if (!admin || !admin.isActive) {
            throw new common_1.UnauthorizedException('admin user not found or inactive');
        }
        if (!this.verifyPassword(currentPassword, admin.password)) {
            throw new common_1.UnauthorizedException('current password is incorrect');
        }
        await this.prisma.adminUser.update({
            where: { id: userId },
            data: {
                password: this.hashPassword(newPassword),
                mustChangePassword: false,
            },
        });
        return { ok: true };
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
    buildWhere(query) {
        var _a;
        const where = {};
        if (query.id != null) {
            where.id = query.id;
        }
        if (query.role != null) {
            where.role = query.role;
        }
        if (query.isActive != null) {
            where.isActive = query.isActive;
        }
        const keyword = (_a = query.keyword) === null || _a === void 0 ? void 0 : _a.trim();
        if (keyword) {
            where.OR = [
                { email: { contains: keyword, mode: 'insensitive' } },
                { username: { contains: keyword, mode: 'insensitive' } },
            ];
        }
        return where;
    }
    buildOrderBy(orderBy, order) {
        const field = orderBy !== null && orderBy !== void 0 ? orderBy : 'id';
        const direction = (0, pagination_1.resolveSortOrder)(order);
        return { [field]: direction };
    }
};
AdminUserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AdminUserService);
exports.AdminUserService = AdminUserService;
//# sourceMappingURL=admin-user.service.js.map