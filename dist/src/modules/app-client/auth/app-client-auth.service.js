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
exports.AppClientAuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const app_client_auth_config_util_1 = require("./app-client-auth.config.util");
const app_client_auth_http_util_1 = require("./app-client-auth-http.util");
let AppClientAuthService = class AppClientAuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loadResolvedAuthConfig(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { authConfig: true },
        });
        if (!row) {
            throw new common_1.BadRequestException(`appClient ${appClientId} not found`);
        }
        return (0, app_client_auth_config_util_1.resolveAppClientAuthConfig)(row.authConfig);
    }
    validateAuthConfigInput(raw) {
        const parsed = (0, app_client_auth_config_util_1.parseAppClientAuthConfig)(raw);
        if (!parsed) {
            throw new common_1.BadRequestException('authConfig cannot be empty');
        }
        return parsed;
    }
    async verifyAccountToken(appClientId, accountToken) {
        const config = await this.loadResolvedAuthConfig(appClientId);
        return this.verifyWithConfig(config, appClientId, accountToken);
    }
    async testAccountToken(appClientId, accountToken) {
        const config = await this.loadResolvedAuthConfig(appClientId);
        const profile = await this.verifyWithConfig(config, appClientId, accountToken);
        return {
            ok: true,
            source: config.source,
            profile: {
                employeeId: profile.employeeId,
                email: profile.email,
                username: profile.username,
                active: profile.active,
                nickName: profile.nickName,
                cnName: profile.cnName,
            },
        };
    }
    async verifyWithConfig(config, appClientId, accountToken) {
        const token = accountToken.trim();
        if (!token) {
            throw new common_1.BadRequestException('accountToken is required');
        }
        switch (config.provider) {
            case 'http_profile':
                if (!config.http) {
                    throw new common_1.BadRequestException('http_profile auth missing http config');
                }
                return (0, app_client_auth_http_util_1.fetchHttpProfileAccount)(config.http, token, appClientId);
            case 'jwt_shared_secret':
                throw new common_1.BadRequestException('jwt_shared_secret provider is not implemented yet');
            default:
                throw new common_1.BadRequestException('unsupported auth provider');
        }
    }
};
AppClientAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppClientAuthService);
exports.AppClientAuthService = AppClientAuthService;
//# sourceMappingURL=app-client-auth.service.js.map