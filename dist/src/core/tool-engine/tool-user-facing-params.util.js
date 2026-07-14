"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOptionalFilterParamNames = exports.listUserFacingRequiredParamNames = exports.isInfraParamName = exports.isInfraToolParam = exports.isSortParam = void 0;
const tool_pagination_params_util_1 = require("./tool-pagination-params.util");
const SORT_PARAM_RE = /^sort(?:_by|order|field)?$/i;
const DEFAULT_EXTRA_INFRA_PARAM_NAMES = ['vo'];
function readExtraInfraParamNames() {
    var _a;
    const raw = (_a = process.env.TOOL_INFRA_PARAM_NAMES) === null || _a === void 0 ? void 0 : _a.trim();
    if (!raw) {
        return new Set(DEFAULT_EXTRA_INFRA_PARAM_NAMES);
    }
    return new Set(raw
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0));
}
function isSortParam(name) {
    return SORT_PARAM_RE.test(name);
}
exports.isSortParam = isSortParam;
function isInfraToolParam(row) {
    if (row.in === 'header') {
        return true;
    }
    if ((0, tool_pagination_params_util_1.isPaginationParam)(row.name)) {
        return true;
    }
    if (isSortParam(row.name)) {
        return true;
    }
    if (readExtraInfraParamNames().has(row.name)) {
        return true;
    }
    return false;
}
exports.isInfraToolParam = isInfraToolParam;
function isInfraParamName(name) {
    if ((0, tool_pagination_params_util_1.isPaginationParam)(name)) {
        return true;
    }
    if (isSortParam(name)) {
        return true;
    }
    if (readExtraInfraParamNames().has(name)) {
        return true;
    }
    if (/^X-[A-Z0-9-]+$/i.test(name)) {
        return true;
    }
    return false;
}
exports.isInfraParamName = isInfraParamName;
function listUserFacingRequiredParamNames(input) {
    var _a, _b, _c;
    const fromParameters = input.parameters
        .filter((row) => row.required && !isInfraToolParam(row))
        .map((row) => row.name);
    const fromBody = (_c = (_b = (_a = input.requestBody) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.filter((row) => row.required && !isInfraToolParam(row)).map((row) => row.name)) !== null && _c !== void 0 ? _c : [];
    return [...new Set([...fromParameters, ...fromBody])];
}
exports.listUserFacingRequiredParamNames = listUserFacingRequiredParamNames;
function listOptionalFilterParamNames(input) {
    var _a;
    const fromParams = input.parameters
        .filter((row) => !row.required && !isInfraToolParam(row))
        .map((row) => row.name);
    const optional = (_a = input.optionalParamNames) !== null && _a !== void 0 ? _a : [];
    return [...new Set([...fromParams, ...optional])];
}
exports.listOptionalFilterParamNames = listOptionalFilterParamNames;
//# sourceMappingURL=tool-user-facing-params.util.js.map