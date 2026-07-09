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
exports.AppClientService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("../../../generated/prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const user_service_1 = require("../user/user.service");
const app_client_auth_service_1 = require("./auth/app-client-auth.service");
const app_client_auth_config_util_1 = require("./auth/app-client-auth.config.util");
let AppClientService = class AppClientService {
    constructor(prisma, userService, appClientAuthService) {
        this.prisma = prisma;
        this.userService = userService;
        this.appClientAuthService = appClientAuthService;
    }
    async create(dto) {
        var _a, _b, _c;
        const name = (_a = dto.name) === null || _a === void 0 ? void 0 : _a.trim();
        if (!name) {
            throw new common_1.BadRequestException('name is required');
        }
        const dsn = await this.generateUniqueDsn();
        return this.prisma.appClient.create({
            data: {
                name,
                dsn,
                description: ((_b = dto.description) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                isActive: (_c = dto.isActive) !== null && _c !== void 0 ? _c : true,
            },
        });
    }
    async findAll() {
        return this.prisma.appClient.findMany({
            orderBy: { id: 'asc' },
        });
    }
    async findOne(id) {
        const row = await this.prisma.appClient.findUnique({ where: { id } });
        if (!row) {
            throw new common_1.NotFoundException(`appClient ${id} not found`);
        }
        return row;
    }
    async update(id, dto) {
        var _a;
        await this.findOne(id);
        const data = {
            name: (_a = dto.name) === null || _a === void 0 ? void 0 : _a.trim(),
            description: dto.description === undefined ? undefined : dto.description.trim(),
            isActive: dto.isActive,
        };
        if (dto.authConfig !== undefined) {
            if (dto.authConfig === null) {
                data.authConfig = client_1.Prisma.DbNull;
            }
            else {
                data.authConfig = (0, app_client_auth_config_util_1.parseAppClientAuthConfig)(dto.authConfig);
            }
        }
        try {
            return await this.prisma.appClient.update({
                where: { id },
                data,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`appClient ${id} not found`);
            }
            throw error;
        }
    }
    async remove(id) {
        await this.findOne(id);
        const blockers = await this.collectAppClientDeleteBlockers(id);
        if (blockers.length > 0) {
            throw new common_1.BadRequestException(`appClient ${id} cannot be deleted while referenced by: ${blockers.join(', ')}`);
        }
        try {
            return await this.prisma.appClient.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException(`appClient ${id} is referenced by other records and cannot be deleted`);
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                throw new common_1.NotFoundException(`appClient ${id} not found`);
            }
            throw error;
        }
    }
    async collectAppClientDeleteBlockers(appClientId) {
        const [agents, tools, sessions, messageTurns, agentRuns, integrations, userApps, promptTemplates, skills,] = await this.prisma.$transaction([
            this.prisma.agent.count({ where: { appClientId } }),
            this.prisma.tool.count({ where: { appClientId } }),
            this.prisma.session.count({ where: { appClientId } }),
            this.prisma.messageTurn.count({ where: { appClientId } }),
            this.prisma.agentRun.count({ where: { appClientId } }),
            this.prisma.integration.count({ where: { appClientId } }),
            this.prisma.userApp.count({ where: { appId: appClientId } }),
            this.prisma.promptTemplate.count({ where: { appClientId } }),
            this.prisma.skill.count({ where: { appClientId } }),
        ]);
        const parts = [];
        if (agents > 0) {
            parts.push(`${agents} agent(s)`);
        }
        if (tools > 0) {
            parts.push(`${tools} tool(s)`);
        }
        if (integrations > 0) {
            parts.push(`${integrations} integration(s)`);
        }
        if (skills > 0) {
            parts.push(`${skills} skill(s)`);
        }
        if (userApps > 0) {
            parts.push(`${userApps} user-app binding(s)`);
        }
        if (sessions > 0) {
            parts.push(`${sessions} session(s)`);
        }
        if (messageTurns > 0) {
            parts.push(`${messageTurns} message turn(s)`);
        }
        if (agentRuns > 0) {
            parts.push(`${agentRuns} agent run(s)`);
        }
        if (promptTemplates > 0) {
            parts.push(`${promptTemplates} prompt template(s)`);
        }
        return parts;
    }
    async authenticate(appClientId, accountToken, appClient) {
        var _a;
        const token = accountToken.trim();
        if (!token) {
            throw new common_1.UnauthorizedException('x-account-token is required');
        }
        const profile = await this.appClientAuthService.verifyAccountToken(appClientId, token);
        if (!profile.active) {
            throw new common_1.UnauthorizedException('external account is inactive');
        }
        const authConfig = await this.appClientAuthService.loadResolvedAuthConfig(appClientId);
        const user = await this.userService.findOrCreateByExternalAccount(profile);
        this.userService.assertUserIsActive(user.status);
        const userAppCreated = await this.ensureUserAppBinding(user.id, appClientId, (_a = authConfig.autoBindRoleName) !== null && _a !== void 0 ? _a : 'operator');
        if (authConfig.propagateTokenToIntegrations !== false) {
            await this.bindUserIntegrations(user.id, appClientId, token);
        }
        const accessToken = await this.userService.signUserAccessToken({
            id: user.id,
            email: user.email,
            username: user.username,
        });
        return {
            ok: true,
            appClient,
            accessToken,
            user,
            accountTokenBound: true,
            userAppCreated,
        };
    }
    async testAuth(appClientId, accountToken) {
        await this.findOne(appClientId);
        return this.appClientAuthService.testAccountToken(appClientId, accountToken);
    }
    async ensureUserAppBinding(userId, appClientId, autoBindRoleName) {
        const existing = await this.prisma.userApp.findUnique({
            where: {
                userId_appId: {
                    userId,
                    appId: appClientId,
                },
            },
            select: { id: true },
        });
        if (existing) {
            return false;
        }
        const roleId = await this.resolveAutoBindRoleId(autoBindRoleName);
        try {
            await this.prisma.userApp.create({
                data: {
                    userId,
                    appId: appClientId,
                    roleId,
                },
            });
            return true;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                return false;
            }
            throw error;
        }
    }
    async resolveAutoBindRoleId(roleName) {
        const normalized = roleName.trim().toLowerCase() || 'operator';
        const role = await this.prisma.role.findUnique({
            where: { name: normalized },
            select: { id: true },
        });
        if (!role) {
            throw new common_1.BadRequestException(`default auth role "${normalized}" not found; run db:seed or configure autoBindRoleName`);
        }
        return role.id;
    }
    async bindUserIntegrations(userId, appClientId, accountToken) {
        const integrations = await this.prisma.integration.findMany({
            where: { appClientId },
            select: { id: true },
        });
        if (integrations.length === 0) {
            return;
        }
        await this.prisma.$transaction(integrations.map((integration) => this.prisma.userIntegration.upsert({
            where: {
                userId_integrationId: {
                    userId,
                    integrationId: integration.id,
                },
            },
            create: {
                userId,
                integrationId: integration.id,
                userApiKey: accountToken,
                isActive: true,
            },
            update: {
                userApiKey: accountToken,
                isActive: true,
            },
        })));
    }
    createRandomDsn() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
    async generateUniqueDsn() {
        let candidate = this.createRandomDsn();
        while (true) {
            const existing = await this.prisma.appClient.findUnique({
                where: { dsn: candidate },
                select: { id: true },
            });
            if (!existing) {
                return candidate;
            }
            candidate = this.createRandomDsn();
        }
    }
};
AppClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService,
        app_client_auth_service_1.AppClientAuthService])
], AppClientService);
exports.AppClientService = AppClientService;
//# sourceMappingURL=app-client.service.js.map