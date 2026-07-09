"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toIntegrationResponseList = exports.toIntegrationResponse = void 0;
function toIntegrationResponse(row) {
    var _a, _b;
    const { apiKey } = row, safe = __rest(row, ["apiKey"]);
    return Object.assign(Object.assign({}, safe), { toolCount: (_b = (_a = row._count) === null || _a === void 0 ? void 0 : _a.tools) !== null && _b !== void 0 ? _b : 0, systemConfigured: Boolean(apiKey === null || apiKey === void 0 ? void 0 : apiKey.trim()) });
}
exports.toIntegrationResponse = toIntegrationResponse;
function toIntegrationResponseList(rows) {
    return rows.map(toIntegrationResponse);
}
exports.toIntegrationResponseList = toIntegrationResponseList;
//# sourceMappingURL=integration.mapper.js.map