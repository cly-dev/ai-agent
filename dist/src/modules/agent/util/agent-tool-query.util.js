"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentToolBindingsOrderBy = exports.buildAgentToolBindingsWhere = void 0;
const tool_list_filter_util_1 = require("../../tool/tool-list-filter.util");
function buildAgentToolBindingsWhere(agentId, appClientId, query) {
    return {
        agentId,
        tool: (0, tool_list_filter_util_1.buildToolWhereFromFilters)(query, { appClientId }),
    };
}
exports.buildAgentToolBindingsWhere = buildAgentToolBindingsWhere;
function buildAgentToolBindingsOrderBy(orderBy, order) {
    const field = orderBy !== null && orderBy !== void 0 ? orderBy : 'toolId';
    if (field === 'toolId' || field === 'id') {
        return { [field]: order };
    }
    return { tool: { [field]: order } };
}
exports.buildAgentToolBindingsOrderBy = buildAgentToolBindingsOrderBy;
//# sourceMappingURL=agent-tool-query.util.js.map