"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPublicAdminAuthRoute = exports.isUnderAdminUrlPath = void 0;
const ADMIN_PREFIX = '/admin';
function isUnderAdminUrlPath(req) {
    const path = req.path;
    return path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
}
exports.isUnderAdminUrlPath = isUnderAdminUrlPath;
function isPublicAdminAuthRoute(req) {
    if (req.method !== 'POST') {
        return false;
    }
    const path = req.path.replace(/\/+$/, '') || '/';
    return path === `${ADMIN_PREFIX}/admin-user/login`;
}
exports.isPublicAdminAuthRoute = isPublicAdminAuthRoute;
//# sourceMappingURL=admin-url-path.util.js.map