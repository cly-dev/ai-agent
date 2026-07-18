"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FLOW_LIST_INCLUDE = exports.FLOW_DETAIL_INCLUDE = void 0;
const agent_types_1 = require("../agent/types/agent.types");
const host_tool_types_1 = require("../host-tool/host-tool.types");
exports.FLOW_DETAIL_INCLUDE = {
    appClient: { select: { id: true, name: true, dsn: true } },
    flowTools: {
        orderBy: { toolId: 'asc' },
        include: {
            tool: { select: agent_types_1.AGENT_LINKED_TOOL_SELECT },
        },
    },
    flowHostTools: {
        orderBy: { hostToolId: 'asc' },
        include: {
            hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE },
        },
    },
    _count: {
        select: {
            skills: true,
            pageActions: true,
            revisions: true,
        },
    },
};
exports.FLOW_LIST_INCLUDE = {
    appClient: { select: { id: true, name: true, dsn: true } },
    _count: {
        select: {
            skills: true,
            pageActions: true,
        },
    },
};
//# sourceMappingURL=flow.types.js.map