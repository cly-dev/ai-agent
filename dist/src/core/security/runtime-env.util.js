"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSwaggerEnabled = exports.isDevStaticAssetsEnabled = exports.isFalsyEnv = exports.isTruthyEnv = exports.isProductionRuntime = void 0;
const PRODUCTION_NODE_ENVS = new Set(['prod', 'production']);
function isProductionRuntime() {
    var _a, _b;
    const nodeEnv = (_b = (_a = process.env.NODE_ENV) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) !== null && _b !== void 0 ? _b : '';
    return PRODUCTION_NODE_ENVS.has(nodeEnv);
}
exports.isProductionRuntime = isProductionRuntime;
function isTruthyEnv(value) {
    const normalized = value === null || value === void 0 ? void 0 : value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'yes';
}
exports.isTruthyEnv = isTruthyEnv;
function isFalsyEnv(value) {
    const normalized = value === null || value === void 0 ? void 0 : value.trim().toLowerCase();
    return normalized === '0' || normalized === 'false' || normalized === 'off' || normalized === 'no';
}
exports.isFalsyEnv = isFalsyEnv;
function isDevStaticAssetsEnabled() {
    if (isTruthyEnv(process.env.ENABLE_DEV_STATIC)) {
        return true;
    }
    if (isFalsyEnv(process.env.ENABLE_DEV_STATIC)) {
        return false;
    }
    return !isProductionRuntime();
}
exports.isDevStaticAssetsEnabled = isDevStaticAssetsEnabled;
function isSwaggerEnabled() {
    if (isTruthyEnv(process.env.ENABLE_SWAGGER)) {
        return true;
    }
    if (isFalsyEnv(process.env.ENABLE_SWAGGER)) {
        return false;
    }
    return !isProductionRuntime();
}
exports.isSwaggerEnabled = isSwaggerEnabled;
//# sourceMappingURL=runtime-env.util.js.map