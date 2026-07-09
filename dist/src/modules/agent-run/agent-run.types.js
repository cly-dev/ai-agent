"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_RUN_DETAIL_INCLUDE = void 0;
exports.AGENT_RUN_DETAIL_INCLUDE = {
    turn: {
        select: {
            id: true,
            status: true,
            userInput: true,
            finalOutput: true,
            createdAt: true,
        },
    },
    agent: { select: { id: true, name: true, appClientId: true } },
    appClient: { select: { id: true, name: true } },
    session: { select: { id: true, title: true } },
    parentRun: { select: { id: true, status: true, role: true, sequence: true } },
    childRuns: {
        orderBy: { sequence: 'asc' },
        select: { id: true, status: true, role: true, sequence: true },
    },
};
//# sourceMappingURL=agent-run.types.js.map