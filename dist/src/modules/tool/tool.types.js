"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DETAIL_INCLUDE = void 0;
exports.TOOL_DETAIL_INCLUDE = {
    appClient: true,
    toolCategory: true,
    integration: true,
    agentTools: {
        include: {
            agent: {
                select: {
                    id: true,
                    name: true,
                    appClientId: true,
                    enableToolCall: true,
                    maxSteps: true,
                },
            },
        },
    },
    skillTools: {
        include: {
            skill: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
        },
    },
    roleTools: {
        include: {
            role: {
                select: {
                    id: true,
                    name: true,
                    allowToolLevel: true,
                },
            },
        },
    },
};
//# sourceMappingURL=tool.types.js.map