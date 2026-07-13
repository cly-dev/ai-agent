"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toToolResponseList = exports.toToolResponse = void 0;
function toToolResponse(row) {
    var _a, _b;
    const tags = [];
    const categoryLabel = (_b = (_a = row.toolCategory) === null || _a === void 0 ? void 0 : _a.label) === null || _b === void 0 ? void 0 : _b.trim();
    if (categoryLabel) {
        tags.push(categoryLabel);
    }
    return Object.assign(Object.assign({}, row), { tags });
}
exports.toToolResponse = toToolResponse;
function toToolResponseList(rows) {
    return rows.map((row) => toToolResponse(row));
}
exports.toToolResponseList = toToolResponseList;
//# sourceMappingURL=tool.mapper.js.map