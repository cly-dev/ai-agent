"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmupIntegrationCredentials = exports.integrationCredentialCacheKey = void 0;
function integrationCredentialCacheKey(userId, integrationId) {
    return `${userId}:${integrationId}`;
}
exports.integrationCredentialCacheKey = integrationCredentialCacheKey;
async function warmupIntegrationCredentials(input) {
    var _a, _b;
    const integrationCredentialCache = new Map();
    const integrationIds = [...new Set(input.integrationIds)];
    if (integrationIds.length === 0) {
        return integrationCredentialCache;
    }
    const userIntegrations = await input.prisma.userIntegration.findMany({
        where: {
            userId: input.userId,
            integrationId: { in: integrationIds },
            isActive: true,
        },
        select: {
            integrationId: true,
            userApiKey: true,
        },
    });
    for (const row of userIntegrations) {
        integrationCredentialCache.set(integrationCredentialCacheKey(input.userId, row.integrationId), (_b = (_a = row.userApiKey) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : '');
    }
    return integrationCredentialCache;
}
exports.warmupIntegrationCredentials = warmupIntegrationCredentials;
//# sourceMappingURL=integration-credential-resolver.util.js.map