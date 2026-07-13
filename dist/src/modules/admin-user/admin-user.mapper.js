"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAdminUserResponse = void 0;
function toAdminUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
exports.toAdminUserResponse = toAdminUserResponse;
//# sourceMappingURL=admin-user.mapper.js.map