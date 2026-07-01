"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAllowedClientCorsOrigin = exports.resolveAllowedCorsOrigin = exports.shouldReflectClientCorsOrigin = exports.shouldReflectCorsOrigin = exports.getClientCorsAllowlist = exports.getCorsAllowlist = void 0;
const runtime_env_util_1 = require("../core/security/runtime-env.util");
function parseCorsOrigins() {
    var _a, _b;
    const raw = ((_a = process.env.CORS_ORIGINS) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = process.env.CLIENT_CORS_ORIGINS) === null || _b === void 0 ? void 0 : _b.trim());
    if (!raw) {
        return [];
    }
    return raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
let cachedOrigins = null;
function getCorsAllowlist() {
    if (cachedOrigins === null) {
        cachedOrigins = parseCorsOrigins();
    }
    return cachedOrigins;
}
exports.getCorsAllowlist = getCorsAllowlist;
exports.getClientCorsAllowlist = getCorsAllowlist;
function shouldReflectCorsOrigin() {
    if (getCorsAllowlist().length > 0) {
        return false;
    }
    return !(0, runtime_env_util_1.isProductionRuntime)();
}
exports.shouldReflectCorsOrigin = shouldReflectCorsOrigin;
exports.shouldReflectClientCorsOrigin = shouldReflectCorsOrigin;
function resolveAllowedCorsOrigin(origin) {
    if (typeof origin !== 'string' || origin.trim().length === 0) {
        return null;
    }
    const normalized = origin.trim();
    const allowlist = getCorsAllowlist();
    if (allowlist.length > 0) {
        return allowlist.includes(normalized) ? normalized : null;
    }
    if (shouldReflectCorsOrigin()) {
        return normalized;
    }
    return null;
}
exports.resolveAllowedCorsOrigin = resolveAllowedCorsOrigin;
exports.resolveAllowedClientCorsOrigin = resolveAllowedCorsOrigin;
//# sourceMappingURL=client-cors-origins.util.js.map