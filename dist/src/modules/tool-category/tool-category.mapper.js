"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toToolCategoryResponseList = exports.toToolCategoryResponse = void 0;
function toToolCategoryResponse(row) {
    var _a, _b;
    return Object.assign(Object.assign({}, row), { toolCount: (_b = (_a = row._count) === null || _a === void 0 ? void 0 : _a.tools) !== null && _b !== void 0 ? _b : 0 });
}
exports.toToolCategoryResponse = toToolCategoryResponse;
function toToolCategoryResponseList(rows) {
    return rows.map((row) => toToolCategoryResponse(row));
}
exports.toToolCategoryResponseList = toToolCategoryResponseList;
//# sourceMappingURL=tool-category.mapper.js.map