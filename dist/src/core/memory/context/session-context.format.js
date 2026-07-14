"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbMessageRowToMessageTurn = exports.messageTurnsToLlmMessages = exports.formatMessageTurnBody = void 0;
const message_blocks_util_1 = require("../../agent-engine/engine/message/message-blocks.util");
const ALLOWED_ROLES = new Set([
    'system',
    'user',
    'assistant',
    'tool',
]);
function isLlmRole(value) {
    return ALLOWED_ROLES.has(value);
}
function formatMessageTurnBody(turn) {
    var _a, _b, _c, _d, _e;
    if (turn.role === 'tool') {
        const name = (_a = turn.toolName) !== null && _a !== void 0 ? _a : 'tool';
        const input = turn.toolInput !== null && turn.toolInput !== undefined
            ? JSON.stringify(turn.toolInput)
            : '';
        const output = turn.toolOutput !== null && turn.toolOutput !== undefined
            ? JSON.stringify(turn.toolOutput)
            : '';
        const head = (_c = (_b = turn.content) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : '';
        const parts = [
            head || `[tool ${name}]`,
            input ? `args: ${input}` : null,
            output ? `result: ${output}` : null,
        ].filter((p) => p != null && p.length > 0);
        return parts.join('\n');
    }
    const raw = (_e = (_d = turn.content) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : '';
    if (turn.role === 'assistant' && raw.startsWith('{')) {
        const blocks = (0, message_blocks_util_1.tryParseStoredMessageBlocks)(raw);
        if (blocks === null || blocks === void 0 ? void 0 : blocks.length) {
            const plain = (0, message_blocks_util_1.messageBlocksToPlainText)(blocks).trim();
            if (plain.length > 0) {
                return plain;
            }
        }
    }
    return raw;
}
exports.formatMessageTurnBody = formatMessageTurnBody;
function messageTurnsToLlmMessages(turns, maxMessages) {
    const window = turns.length > maxMessages ? turns.slice(-maxMessages) : turns;
    const out = [];
    for (const turn of window) {
        if (!isLlmRole(turn.role)) {
            continue;
        }
        const text = formatMessageTurnBody(turn);
        if (!text.trim()) {
            continue;
        }
        out.push({ role: turn.role, content: text });
    }
    return out;
}
exports.messageTurnsToLlmMessages = messageTurnsToLlmMessages;
function dbMessageRowToMessageTurn(row) {
    var _a, _b, _c, _d;
    return {
        messageId: row.id,
        role: row.role,
        content: (_a = row.content) !== null && _a !== void 0 ? _a : null,
        toolName: (_b = row.toolName) !== null && _b !== void 0 ? _b : null,
        toolInput: (_c = row.toolInput) !== null && _c !== void 0 ? _c : null,
        toolOutput: (_d = row.toolOutput) !== null && _d !== void 0 ? _d : null,
        createdAt: row.createdAt.toISOString(),
    };
}
exports.dbMessageRowToMessageTurn = dbMessageRowToMessageTurn;
//# sourceMappingURL=session-context.format.js.map