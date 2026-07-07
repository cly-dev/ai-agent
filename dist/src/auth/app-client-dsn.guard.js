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
exports.AppClientDsnGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const app_client_dsn_constants_1 = require("./app-client-dsn.constants");
let AppClientDsnGuard = class AppClientDsnGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        var _a, _b;
        const req = context.switchToHttp().getRequest();
        const raw = req.headers[app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER];
        const dsn = typeof raw === 'string'
            ? raw.trim()
            : Array.isArray(raw)
                ? (_b = (_a = raw[0]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ''
                : '';
        if (!dsn) {
            throw new common_1.UnauthorizedException(`missing or empty header ${app_client_dsn_constants_1.APP_CLIENT_DSN_HEADER}`);
        }
        const row = await this.prisma.appClient.findUnique({
            where: { dsn },
            select: { id: true, dsn: true, name: true, isActive: true },
        });
        if (!row || !row.isActive) {
            throw new common_1.UnauthorizedException('unknown or inactive app client dsn');
        }
        const appClient = {
            id: row.id,
            dsn: row.dsn,
            name: row.name,
        };
        req.appClient = appClient;
        return true;
    }
};
AppClientDsnGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppClientDsnGuard);
exports.AppClientDsnGuard = AppClientDsnGuard;
//# sourceMappingURL=app-client-dsn.guard.js.map