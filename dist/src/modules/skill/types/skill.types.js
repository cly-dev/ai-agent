"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_DETAIL_INCLUDE = exports.SKILL_LIST_INCLUDE = exports.SKILL_TOOLS_INCLUDE_FRAGMENT = exports.SKILL_APP_CLIENT_SELECT = void 0;
const agent_types_1 = require("../../agent/types/agent.types");
const host_tool_types_1 = require("../../host-tool/host-tool.types");
exports.SKILL_APP_CLIENT_SELECT = {
    id: true,
    name: true,
    dsn: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};
exports.SKILL_TOOLS_INCLUDE_FRAGMENT = {
    skillTools: {
        orderBy: { toolId: 'asc' },
        include: {
            tool: {
                select: agent_types_1.AGENT_LINKED_TOOL_SELECT,
            },
        },
    },
};
const SKILL_APP_CLIENT_INCLUDE_FRAGMENT = {
    appClient: {
        select: exports.SKILL_APP_CLIENT_SELECT,
    },
};
const SKILL_COUNTS_INCLUDE_FRAGMENT = {
    _count: {
        select: {
            skillTools: true,
            roleSkills: true,
            skillHostTools: true,
            agentSkills: true,
        },
    },
};
exports.SKILL_LIST_INCLUDE = Object.assign(Object.assign(Object.assign({}, SKILL_APP_CLIENT_INCLUDE_FRAGMENT), exports.SKILL_TOOLS_INCLUDE_FRAGMENT), SKILL_COUNTS_INCLUDE_FRAGMENT);
exports.SKILL_DETAIL_INCLUDE = Object.assign(Object.assign(Object.assign({}, SKILL_APP_CLIENT_INCLUDE_FRAGMENT), exports.SKILL_TOOLS_INCLUDE_FRAGMENT), { skillHostTools: {
        orderBy: [{ priority: 'asc' }, { id: 'asc' }],
        include: {
            hostTool: { include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE },
        },
    }, _count: {
        select: {
            skillTools: true,
            roleSkills: true,
            agentSkills: true,
        },
    } });
//# sourceMappingURL=skill.types.js.map