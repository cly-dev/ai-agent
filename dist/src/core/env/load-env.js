"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = void 0;
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const assert_jwt_secret_util_1 = require("../security/assert-jwt-secret.util");
function resolveEnvName(nodeEnv) {
    if (!nodeEnv) {
        return null;
    }
    const normalized = nodeEnv.trim().toLowerCase();
    if (normalized === 'test') {
        return '.env.test';
    }
    if (normalized === 'prod' || normalized === 'production') {
        return '.env.prod';
    }
    return null;
}
function loadEnv() {
    const rootDir = process.cwd();
    const envFile = resolveEnvName(process.env.NODE_ENV);
    const envPaths = [
        envFile ? path.resolve(rootDir, envFile) : null,
        path.resolve(rootDir, '.env'),
    ].filter((item) => Boolean(item));
    for (const envPath of envPaths) {
        if (!fs.existsSync(envPath)) {
            continue;
        }
        dotenv.config({ path: envPath });
    }
}
exports.loadEnv = loadEnv;
loadEnv();
(0, assert_jwt_secret_util_1.assertJwtSecretConfigured)();
//# sourceMappingURL=load-env.js.map