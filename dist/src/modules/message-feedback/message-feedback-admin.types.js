"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_FEEDBACK_ADMIN_INCLUDE = void 0;
exports.MESSAGE_FEEDBACK_ADMIN_INCLUDE = {
    message: {
        select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
        },
    },
    user: {
        select: {
            id: true,
            username: true,
            employeeId: true,
            email: true,
        },
    },
    session: {
        select: {
            id: true,
            title: true,
            agentId: true,
        },
    },
};
//# sourceMappingURL=message-feedback-admin.types.js.map