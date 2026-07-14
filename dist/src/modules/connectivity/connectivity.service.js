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
exports.ConnectivityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const llm_service_1 = require("../../core/llm/llm.service");
const redis_connection_service_1 = require("../../core/memory/redis/redis-connection.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULT_TARGETS = [
    'database',
    'redis',
    'llm_chat',
    'llm_embedding',
];
let ConnectivityService = class ConnectivityService {
    constructor(prisma, redisConnection, llmService) {
        this.prisma = prisma;
        this.redisConnection = redisConnection;
        this.llmService = llmService;
    }
    async checkDatabase() {
        const startedAt = Date.now();
        try {
            await this.prisma.$queryRaw(client_1.Prisma.sql `SELECT 1`);
            return {
                target: 'database',
                ok: true,
                durationMs: Date.now() - startedAt,
            };
        }
        catch (error) {
            return {
                target: 'database',
                ok: false,
                durationMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async checkRedis() {
        var _a;
        const startedAt = Date.now();
        const ping = await this.redisConnection.ping();
        return Object.assign(Object.assign({ target: 'redis', ok: ping.ok, durationMs: Date.now() - startedAt }, (ping.ok
            ? {}
            : { error: (_a = ping.error) !== null && _a !== void 0 ? _a : 'redis unavailable' })), (ping.configured === false
            ? { detail: { configured: false } }
            : {}));
    }
    async checkLlmChat() {
        const startedAt = Date.now();
        try {
            const result = await this.llmService.testActiveChatConnection();
            return {
                target: 'llm_chat',
                ok: result.ok,
                durationMs: Date.now() - startedAt,
                error: result.error,
                detail: {
                    configId: result.configId,
                    provider: result.provider,
                    model: result.model,
                    probe: result.probe,
                },
            };
        }
        catch (error) {
            return {
                target: 'llm_chat',
                ok: false,
                durationMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async checkLlmEmbedding() {
        const startedAt = Date.now();
        try {
            const result = await this.llmService.testActiveEmbeddingConnection();
            if (!result) {
                return {
                    target: 'llm_embedding',
                    ok: false,
                    durationMs: Date.now() - startedAt,
                    error: 'no active embedding model configured',
                    detail: { configured: false },
                };
            }
            return {
                target: 'llm_embedding',
                ok: result.ok,
                durationMs: Date.now() - startedAt,
                error: result.error,
                detail: {
                    configId: result.configId,
                    provider: result.provider,
                    model: result.model,
                    probe: result.probe,
                },
            };
        }
        catch (error) {
            return {
                target: 'llm_embedding',
                ok: false,
                durationMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async runBatch(targets) {
        const selected = (targets === null || targets === void 0 ? void 0 : targets.length) ? targets : DEFAULT_TARGETS;
        const checks = [];
        for (const target of selected) {
            switch (target) {
                case 'database':
                    checks.push(await this.checkDatabase());
                    break;
                case 'redis':
                    checks.push(await this.checkRedis());
                    break;
                case 'llm_chat':
                    checks.push(await this.checkLlmChat());
                    break;
                case 'llm_embedding':
                    checks.push(await this.checkLlmEmbedding());
                    break;
                default:
                    break;
            }
        }
        return {
            checkedAt: new Date().toISOString(),
            checks,
        };
    }
};
ConnectivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_connection_service_1.RedisConnectionService,
        llm_service_1.LlmService])
], ConnectivityService);
exports.ConnectivityService = ConnectivityService;
//# sourceMappingURL=connectivity.service.js.map