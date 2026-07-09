"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRoleAccessibleToolWhere = exports.allowedToolLevels = exports.resolveMaxToolLevel = void 0;
const client_1 = require("../../../../generated/prisma/client");
const tool_list_filter_util_1 = require("../../tool/tool-list-filter.util");
function resolveMaxToolLevel(levels) {
    if (levels.includes(client_1.ToolLevel.L3)) {
        return client_1.ToolLevel.L3;
    }
    if (levels.includes(client_1.ToolLevel.L2)) {
        return client_1.ToolLevel.L2;
    }
    return client_1.ToolLevel.L1;
}
exports.resolveMaxToolLevel = resolveMaxToolLevel;
function allowedToolLevels(maxLevel) {
    if (maxLevel === client_1.ToolLevel.L3) {
        return [client_1.ToolLevel.L1, client_1.ToolLevel.L2, client_1.ToolLevel.L3];
    }
    if (maxLevel === client_1.ToolLevel.L2) {
        return [client_1.ToolLevel.L1, client_1.ToolLevel.L2];
    }
    return [client_1.ToolLevel.L1];
}
exports.allowedToolLevels = allowedToolLevels;
function buildRoleAccessibleToolWhere(appClientId, ctx, toolFilter) {
    const requireActive = toolFilter.isActive !== false;
    return (0, tool_list_filter_util_1.buildToolWhereFromFilters)(toolFilter, Object.assign(Object.assign({ id: { in: ctx.roleToolIds }, appClientId }, (requireActive ? { isActive: true } : {})), { riskLevel: { in: allowedToolLevels(ctx.maxLevel) } }));
}
exports.buildRoleAccessibleToolWhere = buildRoleAccessibleToolWhere;
//# sourceMappingURL=agent-client-access.util.js.map