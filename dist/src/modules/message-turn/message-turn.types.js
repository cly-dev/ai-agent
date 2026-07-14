"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_TURN_DETAIL_INCLUDE = void 0;
exports.MESSAGE_TURN_DETAIL_INCLUDE = {
    agentRuns: {
        orderBy: { sequence: 'asc' },
        include: {
            agent: { select: { id: true, name: true } },
        },
    },
    message: {
        select: { id: true, role: true, content: true, createdAt: true },
    },
    outputMessage: {
        select: { id: true, role: true, content: true, createdAt: true },
    },
    primaryAgent: { select: { id: true, name: true } },
    session: { select: { id: true, title: true } },
    user: { select: { id: true, username: true } },
    appClient: { select: { id: true, name: true } },
};
//# sourceMappingURL=message-turn.types.js.map