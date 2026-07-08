"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSessionContextPayload = void 0;
function isSessionContextPayload(value) {
    const turns = value.turns;
    if (!Array.isArray(turns)) {
        return false;
    }
    return turns.every((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return false;
        }
        const row = item;
        return (typeof row.messageId === 'number' &&
            typeof row.role === 'string' &&
            typeof row.createdAt === 'string');
    });
}
exports.isSessionContextPayload = isSessionContextPayload;
//# sourceMappingURL=session-context.types.js.map