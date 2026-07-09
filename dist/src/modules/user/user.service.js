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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let UserService = class UserService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.toolLevelWeight = {
            L1: 1,
            L2: 2,
            L3: 3,
        };
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
    async create(data) {
        var _a, _b, _c;
        const email = (_a = data.email) === null || _a === void 0 ? void 0 : _a.trim();
        const username = (_b = data.username) === null || _b === void 0 ? void 0 : _b.trim();
        if (!email) {
            throw new common_1.BadRequestException('email is required');
        }
        if (!username) {
            throw new common_1.BadRequestException('username is required');
        }
        const employeeId = ((_c = data.employeeId) === null || _c === void 0 ? void 0 : _c.trim()) ||
            `admin_${username}_${(0, crypto_1.randomBytes)(4).toString('hex')}`;
        const initialPassword = this.generateInitialPassword();
        const hashedPassword = this.hashPassword(initialPassword);
        const createdUser = await this.prisma.user.create({
            data: {
                employeeId,
                email,
                password: hashedPassword,
                username,
                mustChangePassword: true,
            },
        });
        const safeUser = Object.assign({}, createdUser);
        delete safeUser.password;
        return Object.assign(Object.assign({}, safeUser), { generatedPassword: initialPassword });
    }
    async findAll() {
        return this.prisma.user.findMany({
            orderBy: { id: 'asc' },
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            throw new common_1.NotFoundException(`user ${id} not found`);
        }
        return user;
    }
    async update(id, data) {
        var _a, _b, _c;
        const email = (_a = data.email) === null || _a === void 0 ? void 0 : _a.trim();
        const password = (_b = data.password) === null || _b === void 0 ? void 0 : _b.trim();
        const username = (_c = data.username) === null || _c === void 0 ? void 0 : _c.trim();
        if (email !== undefined && !email) {
            throw new common_1.BadRequestException('email cannot be empty');
        }
        if (username !== undefined && !username) {
            throw new common_1.BadRequestException('username cannot be empty');
        }
        if (password !== undefined && !password) {
            throw new common_1.BadRequestException('password cannot be empty');
        }
        const hashedPassword = password !== undefined ? this.hashPassword(password) : undefined;
        try {
            return await this.prisma.user.update({
                where: { id },
                data: {
                    email,
                    password: hashedPassword,
                    username,
                    status: data.status,
                    mustChangePassword: password !== undefined ? false : undefined,
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`user ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        try {
            return await this.prisma.user.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`user ${id} not found`);
            }
            throw error;
        }
    }
    syntheticEmployeeIdFromEmail(email) {
        const digest = (0, crypto_1.createHash)('sha256')
            .update(email.trim().toLowerCase())
            .digest('hex')
            .slice(0, 24);
        return `ext_${digest}`;
    }
    async findOrCreateByExternalAccount(profile) {
        var _a, _b, _c, _d, _e;
        const email = (_a = profile.email) === null || _a === void 0 ? void 0 : _a.trim();
        if (!email) {
            throw new common_1.BadRequestException('email is required from external account');
        }
        const employeeId = (_b = profile.employeeId) === null || _b === void 0 ? void 0 : _b.trim();
        const username = ((_c = profile.nickName) === null || _c === void 0 ? void 0 : _c.trim()) ||
            ((_d = profile.cnName) === null || _d === void 0 ? void 0 : _d.trim()) ||
            ((_e = profile.username) === null || _e === void 0 ? void 0 : _e.trim()) ||
            employeeId ||
            email;
        const existingByEmployeeId = employeeId
            ? await this.prisma.user.findUnique({ where: { employeeId } })
            : null;
        const existing = existingByEmployeeId !== null && existingByEmployeeId !== void 0 ? existingByEmployeeId : (await this.prisma.user.findFirst({ where: { email } }));
        if (existing) {
            this.assertUserIsActive(existing.status);
            const updated = await this.prisma.user.update({
                where: { id: existing.id },
                data: Object.assign({ email,
                    username }, (employeeId && existing.employeeId !== employeeId
                    ? { employeeId }
                    : {})),
            });
            return this.toSafeUser(updated);
        }
        const resolvedEmployeeId = employeeId || this.syntheticEmployeeIdFromEmail(email);
        const created = await this.prisma.user.create({
            data: {
                employeeId: resolvedEmployeeId,
                email,
                username,
                password: this.hashPassword(this.generateInitialPassword()),
                mustChangePassword: false,
            },
        });
        return this.toSafeUser(created);
    }
    async signUserAccessToken(user) {
        return this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            username: user.username,
        });
    }
    assertUserIsActive(status) {
        if (status !== client_1.UserStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('user account is disabled');
        }
    }
    toSafeUser(user) {
        const safeUser = Object.assign({}, user);
        delete safeUser.password;
        return safeUser;
    }
    async login(data) {
        var _a, _b;
        const email = (_a = data.email) === null || _a === void 0 ? void 0 : _a.trim();
        const password = (_b = data.password) === null || _b === void 0 ? void 0 : _b.trim();
        if (!email || !password) {
            throw new common_1.BadRequestException('email and password are required');
        }
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
            throw new common_1.UnauthorizedException('invalid email or password');
        }
        const verified = this.verifyPassword(password, user.password);
        if (!verified) {
            throw new common_1.UnauthorizedException('invalid email or password');
        }
        this.assertUserIsActive(user.status);
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        const safeUser = Object.assign({}, user);
        delete safeUser.password;
        return {
            accessToken,
            user: safeUser,
            mustChangePassword: user.mustChangePassword,
        };
    }
    async getPasswordReminder(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { mustChangePassword: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`user ${userId} not found`);
        }
        return {
            mustChangePassword: user.mustChangePassword,
            message: user.mustChangePassword
                ? '首次登录请尽快修改密码'
                : '密码状态正常，无需修改',
        };
    }
    async getAllowedToolsForApp(userId, appClientId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            throw new common_1.NotFoundException(`user ${userId} not found`);
        }
        const userApp = await this.prisma.userApp.findUnique({
            where: {
                userId_appId: { userId, appId: appClientId },
            },
            include: {
                role: {
                    include: {
                        roleTools: {
                            include: { tool: true },
                            orderBy: { toolId: 'asc' },
                        },
                    },
                },
            },
        });
        if (!userApp) {
            return [];
        }
        const maxAllowedLevel = this.toolLevelWeight[userApp.role.allowToolLevel];
        return userApp.role.roleTools
            .map((mapping) => mapping.tool)
            .filter((tool) => tool.isActive &&
            this.toolLevelWeight[tool.riskLevel] <= maxAllowedLevel);
    }
};
UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map