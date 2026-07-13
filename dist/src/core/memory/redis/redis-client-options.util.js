"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIoRedisClientOptions = exports.readRedisConnectTimeoutMs = void 0;
function readRedisConnectTimeoutMs() {
    var _a;
    const raw = (_a = process.env.REDIS_CONNECT_TIMEOUT_MS) === null || _a === void 0 ? void 0 : _a.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : 5000;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}
exports.readRedisConnectTimeoutMs = readRedisConnectTimeoutMs;
function buildIoRedisClientOptions(input = {}) {
    return Object.assign({ maxRetriesPerRequest: 2, connectTimeout: readRedisConnectTimeoutMs(), commandTimeout: readRedisConnectTimeoutMs(), lazyConnect: true }, (input.password ? { password: input.password } : {}));
}
exports.buildIoRedisClientOptions = buildIoRedisClientOptions;
//# sourceMappingURL=redis-client-options.util.js.map