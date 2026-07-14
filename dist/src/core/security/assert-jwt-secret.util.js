"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertJwtSecretConfigured = void 0;
const runtime_env_util_1 = require("./runtime-env.util");
const INSECURE_JWT_SECRETS = new Set([
    'dev-jwt-secret',
    'change-me',
    'secret',
    'jwt-secret',
]);
const MIN_JWT_SECRET_LENGTH = 32;
function assertJwtSecretConfigured() {
    var _a, _b;
    const raw = (_b = (_a = process.env.JWT_SECRET) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '';
    if (!raw) {
        if ((0, runtime_env_util_1.isProductionRuntime)()) {
            throw new Error('JWT_SECRET is required in production. Set a strong random secret (≥32 chars).');
        }
        process.env.JWT_SECRET = 'dev-jwt-secret';
        return;
    }
    if (!(0, runtime_env_util_1.isProductionRuntime)()) {
        return;
    }
    if (raw.length < MIN_JWT_SECRET_LENGTH) {
        throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production.`);
    }
    if (INSECURE_JWT_SECRETS.has(raw.toLowerCase())) {
        throw new Error('JWT_SECRET uses a known insecure default. Set a strong random secret in production.');
    }
}
exports.assertJwtSecretConfigured = assertJwtSecretConfigured;
//# sourceMappingURL=assert-jwt-secret.util.js.map