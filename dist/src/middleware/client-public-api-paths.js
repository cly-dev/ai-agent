"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesClientPublicApiPath = exports.stripAdminPrefix = exports.normalizeRequestPath = exports.CLIENT_PUBLIC_API_EXCLUDES = void 0;
const common_1 = require("@nestjs/common");
exports.CLIENT_PUBLIC_API_EXCLUDES = [
    { path: 'chat', method: common_1.RequestMethod.ALL },
    { path: 'chat/(.*)', method: common_1.RequestMethod.ALL },
    { path: 'user/login', method: common_1.RequestMethod.POST },
    { path: 'user/password-reminder', method: common_1.RequestMethod.GET },
    { path: 'app-client/auth', method: common_1.RequestMethod.POST },
    { path: 'agent/client/list', method: common_1.RequestMethod.GET },
    { path: 'agent/client/available', method: common_1.RequestMethod.GET },
    { path: 'agent/:agentId/skills/client', method: common_1.RequestMethod.GET },
    { path: 'host-tool/client/catalog', method: common_1.RequestMethod.GET },
    { path: 'host-tool/client/register', method: common_1.RequestMethod.POST },
    { path: 'page-action/invoke', method: common_1.RequestMethod.POST },
    {
        path: 'page-agent/compatible-mode/v1/chat/completions',
        method: common_1.RequestMethod.POST,
    },
    { path: 'approval', method: common_1.RequestMethod.ALL },
    { path: 'approval/(.*)', method: common_1.RequestMethod.ALL },
];
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function nestExcludePathToRegex(nestPath) {
    if (nestPath.endsWith('(.*)')) {
        const base = nestPath.slice(0, -'(.*)'.length).replace(/\/$/, '');
        const basePattern = base
            .split('/')
            .filter(Boolean)
            .map((segment) => segment.startsWith(':') ? '[^/]+' : escapeRegex(segment))
            .join('/');
        return new RegExp(`^/${basePattern}(/.*)?$`);
    }
    const pattern = nestPath
        .split('/')
        .filter(Boolean)
        .map((segment) => segment.startsWith(':') ? '[^/]+' : escapeRegex(segment))
        .join('/');
    return new RegExp(`^/${pattern}$`);
}
const CLIENT_PUBLIC_API_PATH_REGEXES = exports.CLIENT_PUBLIC_API_EXCLUDES.map((route) => nestExcludePathToRegex(route.path));
function normalizeRequestPath(path) {
    return path.replace(/\/+$/, '') || '/';
}
exports.normalizeRequestPath = normalizeRequestPath;
function stripAdminPrefix(path) {
    const normalized = normalizeRequestPath(path);
    if (normalized === '/admin') {
        return '/';
    }
    if (normalized.startsWith('/admin/')) {
        return normalized.slice('/admin'.length) || '/';
    }
    return normalized;
}
exports.stripAdminPrefix = stripAdminPrefix;
function matchesClientPublicApiPath(path) {
    const normalized = stripAdminPrefix(path);
    return CLIENT_PUBLIC_API_PATH_REGEXES.some((pattern) => pattern.test(normalized));
}
exports.matchesClientPublicApiPath = matchesClientPublicApiPath;
//# sourceMappingURL=client-public-api-paths.js.map