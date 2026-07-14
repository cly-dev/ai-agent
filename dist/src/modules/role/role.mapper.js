"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRoleResponseList = exports.toRoleResponse = void 0;
function toRoleResponse(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        allowToolLevel: row.allowToolLevel,
        createdAt: row.createdAt,
        _count: row._count,
    };
}
exports.toRoleResponse = toRoleResponse;
function toRoleResponseList(rows) {
    return rows.map(toRoleResponse);
}
exports.toRoleResponseList = toRoleResponseList;
//# sourceMappingURL=role.mapper.js.map