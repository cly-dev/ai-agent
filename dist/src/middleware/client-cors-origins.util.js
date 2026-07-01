"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAllowedClientCorsOrigin = exports.shouldReflectClientCorsOrigin = exports.getClientCorsAllowlist = void 0;
const runtime_env_util_1 = require("../core/security/runtime-env.util");
function parseClientCorsOrigins() {
    var _a;
    const raw = (_a = process.env.CLIENT_CORS_ORIGINS) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return [];
    }
    return raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
let cachedOrigins = null;
function getClientCorsAllowlist() {
    if (cachedOrigins === null) {
        cachedOrigins = parseClientCorsOrigins();
    }
    return cachedOrigins;
}
exports.getClientCorsAllowlist = getClientCorsAllowlist;
function shouldReflectClientCorsOrigin() {
    if (getClientCorsAllowlist().length > 0) {
        return false;
    }
    return !(0, runtime_env_util_1.isProductionRuntime)();
}
exports.shouldReflectClientCorsOrigin = shouldReflectClientCorsOrigin;
function resolveAllowedClientCorsOrigin(origin) {
    if (typeof origin !== 'string' || origin.trim().length === 0) {
        return null;
    }
    const normalized = origin.trim();
    const allowlist = getClientCorsAllowlist();
    if (allowlist.length > 0) {
        return allowlist.includes(normalized) ? normalized : null;
    }
    if (shouldReflectClientCorsOrigin()) {
        return normalized;
    }
    return null;
}
exports.resolveAllowedClientCorsOrigin = resolveAllowedClientCorsOrigin;
//# sourceMappingURL=client-cors-origins.util.js.map