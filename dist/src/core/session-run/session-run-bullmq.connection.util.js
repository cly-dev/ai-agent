"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readHttpServerEnabled = exports.readSessionRunJobAttempts = exports.readSessionRunWorkerEnabled = exports.readSessionRunWorkerConcurrency = exports.buildSessionRunBullMqConnection = void 0;
function buildSessionRunBullMqConnection() {
    var _a, _b, _c, _d;
    const url = (_a = process.env.REDIS_URL) === null || _a === void 0 ? void 0 : _a.trim();
    const host = (_b = process.env.REDIS_HOST) === null || _b === void 0 ? void 0 : _b.trim();
    if (!url && !host) {
        return null;
    }
    const password = ((_c = process.env.REDIS_PASSWORD) === null || _c === void 0 ? void 0 : _c.trim()) || undefined;
    if (url) {
        return { url, password, maxRetriesPerRequest: null };
    }
    return {
        host,
        port: Number.parseInt((_d = process.env.REDIS_PORT) !== null && _d !== void 0 ? _d : '6379', 10),
        password,
        db: process.env.REDIS_DB
            ? Number.parseInt(process.env.REDIS_DB, 10)
            : undefined,
        maxRetriesPerRequest: null,
    };
}
exports.buildSessionRunBullMqConnection = buildSessionRunBullMqConnection;
function readSessionRunWorkerConcurrency() {
    var _a;
    const raw = (_a = process.env.SESSION_RUN_WORKER_CONCURRENCY) === null || _a === void 0 ? void 0 : _a.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : 8;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}
exports.readSessionRunWorkerConcurrency = readSessionRunWorkerConcurrency;
function readSessionRunWorkerEnabled() {
    var _a;
    const raw = (_a = process.env.SESSION_RUN_WORKER_ENABLED) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (raw === '0' || raw === 'false' || raw === 'no') {
        return false;
    }
    return true;
}
exports.readSessionRunWorkerEnabled = readSessionRunWorkerEnabled;
function readSessionRunJobAttempts() {
    var _a;
    const raw = (_a = process.env.SESSION_RUN_JOB_ATTEMPTS) === null || _a === void 0 ? void 0 : _a.trim();
    const parsed = raw ? Number.parseInt(raw, 10) : 3;
    return Number.isFinite(parsed) && parsed >= 1 ? parsed : 3;
}
exports.readSessionRunJobAttempts = readSessionRunJobAttempts;
function readHttpServerEnabled() {
    var _a;
    const raw = (_a = process.env.SESSION_RUN_HTTP_ENABLED) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    if (raw === '0' || raw === 'false' || raw === 'no') {
        return false;
    }
    return true;
}
exports.readHttpServerEnabled = readHttpServerEnabled;
//# sourceMappingURL=session-run-bullmq.connection.util.js.map