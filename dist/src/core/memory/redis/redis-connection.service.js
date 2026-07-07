"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisConnectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnectionService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const redis_client_options_util_1 = require("./redis-client-options.util");
let RedisConnectionService = RedisConnectionService_1 = class RedisConnectionService {
    constructor() {
        this.logger = new common_1.Logger(RedisConnectionService_1.name);
        this.client = null;
    }
    async onModuleInit() {
        var _a, _b, _c, _d;
        const url = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
        const host = (_b = process.env.REDIS_HOST) === null || _b === void 0 ? void 0 : _b.trim();
        const password = ((_c = process.env.REDIS_PASSWORD) === null || _c === void 0 ? void 0 : _c.trim()) || undefined;
        if (!url && !host) {
            this.logger.warn('REDIS_URL / REDIS_HOST not set — user memory & session context stores are disabled');
            return;
        }
        try {
            const clientOptions = (0, redis_client_options_util_1.buildIoRedisClientOptions)({ password });
            this.client = url
                ? new ioredis_1.default(url, clientOptions)
                : new ioredis_1.default(Object.assign({ host, port: Number.parseInt((_d = process.env.REDIS_PORT) !== null && _d !== void 0 ? _d : '6379', 10), db: process.env.REDIS_DB
                        ? Number.parseInt(process.env.REDIS_DB, 10)
                        : undefined }, clientOptions));
            await this.client.connect();
            await this.client.ping();
            this.logger.log('Redis connected');
        }
        catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            this.logger.error(`Redis connection failed; memory stores will be unavailable (${reason})`, err instanceof Error ? err.stack : String(err));
            if (this.client) {
                this.client.disconnect();
            }
            this.client = null;
        }
    }
    onModuleDestroy() {
        if (this.client) {
            void this.client.quit();
            this.client = null;
        }
    }
    isConfigured() {
        var _a, _b;
        return !!(((_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim()) || ((_b = process.env.REDIS_HOST) === null || _b === void 0 ? void 0 : _b.trim()));
    }
    getClient() {
        return this.client;
    }
    async ping() {
        var _a, _b;
        const url = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
        const host = (_b = process.env.REDIS_HOST) === null || _b === void 0 ? void 0 : _b.trim();
        if (!url && !host) {
            return { ok: false, configured: false, error: 'redis not configured' };
        }
        if (!this.client) {
            return { ok: false, configured: true, error: 'redis client unavailable' };
        }
        try {
            await this.client.ping();
            return { ok: true, configured: true };
        }
        catch (error) {
            return {
                ok: false,
                configured: true,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
};
RedisConnectionService = RedisConnectionService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisConnectionService);
exports.RedisConnectionService = RedisConnectionService;
//# sourceMappingURL=redis-connection.service.js.map