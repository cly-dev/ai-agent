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
exports.UserAppService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let UserAppService = class UserAppService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(body) {
        await this.ensureBaseEntities(body.userId, body.appId, body.roleId);
        await this.ensureUniqueUserApp(body.userId, body.appId);
        try {
            return await this.prisma.userApp.create({
                data: {
                    userId: body.userId,
                    appId: body.appId,
                    roleId: body.roleId,
                },
            });
        }
        catch (error) {
            this.rethrowPrismaError(error);
            throw error;
        }
    }
    async findAll() {
        return this.prisma.userApp.findMany({
            include: {
                user: { select: { id: true, email: true, username: true } },
                appClient: { select: { id: true, name: true, dsn: true } },
                role: { select: { id: true, name: true, allowToolLevel: true } },
            },
            orderBy: { id: 'asc' },
        });
    }
    async findOne(id) {
        const row = await this.prisma.userApp.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, email: true, username: true } },
                appClient: { select: { id: true, name: true, dsn: true } },
                role: { select: { id: true, name: true, allowToolLevel: true } },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException(`user-app ${id} not found`);
        }
        return row;
    }
    async update(id, body) {
        var _a, _b, _c;
        const current = await this.findOne(id);
        const nextUserId = (_a = body.userId) !== null && _a !== void 0 ? _a : current.userId;
        const nextAppId = (_b = body.appId) !== null && _b !== void 0 ? _b : current.appId;
        const nextRoleId = (_c = body.roleId) !== null && _c !== void 0 ? _c : current.roleId;
        await this.ensureBaseEntities(nextUserId, nextAppId, nextRoleId);
        await this.ensureUniqueUserApp(nextUserId, nextAppId, id);
        return this.prisma.userApp.update({
            where: { id },
            data: {
                userId: body.userId,
                appId: body.appId,
                roleId: body.roleId,
            },
            include: {
                user: { select: { id: true, email: true, username: true } },
                appClient: { select: { id: true, name: true, dsn: true } },
                role: { select: { id: true, name: true, allowToolLevel: true } },
            },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.userApp.delete({ where: { id } });
    }
    async addUser(appId, body) {
        return this.create({ userId: body.userId, appId, roleId: body.roleId });
    }
    async ensureBaseEntities(userId, appId, roleId) {
        const [user, appClient, role] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true },
            }),
            this.prisma.appClient.findUnique({
                where: { id: appId },
                select: { id: true },
            }),
            this.prisma.role.findUnique({
                where: { id: roleId },
                select: { id: true },
            }),
        ]);
        if (!user) {
            throw new common_1.NotFoundException(`user ${userId} not found`);
        }
        if (!appClient) {
            throw new common_1.NotFoundException(`app-client ${appId} not found`);
        }
        if (!role) {
            throw new common_1.NotFoundException(`role ${roleId} not found`);
        }
    }
    async ensureUniqueUserApp(userId, appId, currentId) {
        let exists = null;
        try {
            exists = await this.prisma.userApp.findUnique({
                where: {
                    userId_appId: {
                        userId,
                        appId,
                    },
                },
                select: { id: true },
            });
        }
        catch (error) {
            this.rethrowPrismaError(error);
            throw error;
        }
        if (exists && exists.id !== currentId) {
            throw new common_1.BadRequestException(`user ${userId} already in app ${appId}`);
        }
    }
    rethrowPrismaError(error) {
        if (!(error instanceof client_1.Prisma.PrismaClientKnownRequestError)) {
            return;
        }
        if (error.code === 'P2002') {
            throw new common_1.BadRequestException('user already exists in app');
        }
        if (error.code === 'P2021' || error.code === 'P2022') {
            throw new common_1.BadRequestException('database schema is outdated, please run latest prisma migration');
        }
    }
};
UserAppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserAppService);
exports.UserAppService = UserAppService;
//# sourceMappingURL=user-app.service.js.map