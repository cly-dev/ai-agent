"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptionalBoolean = exports.buildToolWhereFromFilters = void 0;
function buildToolWhereFromFilters(query, base = {}) {
    var _a, _b, _c, _d, _e;
    const where = Object.assign({}, base);
    if (query.id != null) {
        where.id = query.id;
    }
    if ((_a = query.definitionKey) === null || _a === void 0 ? void 0 : _a.trim()) {
        where.definitionKey = query.definitionKey.trim();
    }
    if (query.integrationId != null) {
        where.integrationId = query.integrationId;
    }
    if (query.toolCategoryIdIsNull === true) {
        where.toolCategoryId = null;
    }
    else if (query.toolCategoryId != null) {
        where.toolCategoryId = query.toolCategoryId;
    }
    if ((_b = query.name) === null || _b === void 0 ? void 0 : _b.trim()) {
        where.name = { contains: query.name.trim(), mode: 'insensitive' };
    }
    if ((_c = query.description) === null || _c === void 0 ? void 0 : _c.trim()) {
        where.description = {
            contains: query.description.trim(),
            mode: 'insensitive',
        };
    }
    if ((_d = query.path) === null || _d === void 0 ? void 0 : _d.trim()) {
        where.path = { contains: query.path.trim(), mode: 'insensitive' };
    }
    if ((_e = query.keyword) === null || _e === void 0 ? void 0 : _e.trim()) {
        const keyword = query.keyword.trim();
        where.OR = [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { path: { contains: keyword, mode: 'insensitive' } },
        ];
    }
    if (query.riskLevel != null) {
        where.riskLevel = query.riskLevel;
    }
    if (query.method != null) {
        where.method = query.method;
    }
    if (query.isActive !== undefined) {
        where.isActive = query.isActive;
    }
    return where;
}
exports.buildToolWhereFromFilters = buildToolWhereFromFilters;
function parseOptionalBoolean(value) {
    if (value === true || value === 'true') {
        return true;
    }
    if (value === false || value === 'false') {
        return false;
    }
    return undefined;
}
exports.parseOptionalBoolean = parseOptionalBoolean;
//# sourceMappingURL=tool-list-filter.util.js.map