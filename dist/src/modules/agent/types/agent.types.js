"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_WITH_TOOLS_INCLUDE = exports.AGENT_LIST_INCLUDE = exports.AGENT_TOOLS_INCLUDE_FRAGMENT = exports.AGENT_LINKED_TOOL_SELECT = void 0;
const host_tool_types_1 = require("../../host-tool/host-tool.types");
exports.AGENT_LINKED_TOOL_SELECT = {
    id: true,
    appClientId: true,
    definitionKey: true,
    name: true,
    description: true,
    riskLevel: true,
    method: true,
    path: true,
    integrationId: true,
    toolCategoryId: true,
    isActive: true,
    agentMetadata: true,
    timeout: true,
    createdAt: true,
    updatedAt: true,
    toolCategory: true,
    integration: {
        select: {
            id: true,
            name: true,
            baseUrl: true,
            authMode: true,
            updatedAt: true,
        },
    },
};
exports.AGENT_TOOLS_INCLUDE_FRAGMENT = {
    agentTools: {
        orderBy: { toolId: 'asc' },
        include: {
            tool: {
                select: exports.AGENT_LINKED_TOOL_SELECT,
            },
        },
    },
};
exports.AGENT_LIST_INCLUDE = Object.assign(Object.assign({}, exports.AGENT_TOOLS_INCLUDE_FRAGMENT), { _count: {
        select: { agentHostTools: true },
    } });
exports.AGENT_WITH_TOOLS_INCLUDE = Object.assign(Object.assign({}, exports.AGENT_TOOLS_INCLUDE_FRAGMENT), { agentHostTools: {
        orderBy: { id: 'asc' },
        include: {
            hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE },
        },
    } });
//# sourceMappingURL=agent.types.js.map