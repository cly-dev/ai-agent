"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_DETAIL_INCLUDE = void 0;
exports.SESSION_DETAIL_INCLUDE = {
    user: {
        select: {
            id: true,
            username: true,
        },
    },
    appClient: {
        select: {
            id: true,
            name: true,
            isActive: true,
        },
    },
    _count: {
        select: {
            messages: true,
            agentRuns: true,
            messageTurns: true,
        },
    },
};
//# sourceMappingURL=session.types.js.map