"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAllowedToolsFromCatalog = void 0;
const agent_client_access_util_1 = require("../../modules/agent/util/agent-client-access.util");
function resolveAllowedToolsFromCatalog(catalog, roleCtx) {
    const roleToolIds = new Set(roleCtx.roleToolIds);
    const allowedLevels = new Set((0, agent_client_access_util_1.allowedToolLevels)(roleCtx.maxLevel));
    const toolById = new Map(catalog.tools.map((tool) => [tool.id, tool]));
    return catalog.agentBoundToolIds
        .filter((id) => roleToolIds.has(id))
        .map((id) => toolById.get(id))
        .filter((tool) => tool != null && tool.isActive && allowedLevels.has(tool.riskLevel));
}
exports.resolveAllowedToolsFromCatalog = resolveAllowedToolsFromCatalog;
//# sourceMappingURL=agent-tool-catalog.util.js.map