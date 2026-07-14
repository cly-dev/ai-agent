"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computePageActionKey = exports.PAGE_ACTION_ACTIVE_RUN_STATUSES = void 0;
const crypto_1 = require("crypto");
const client_1 = require("../../../generated/prisma/client");
exports.PAGE_ACTION_ACTIVE_RUN_STATUSES = [
    client_1.PageActionRunStatus.running,
    client_1.PageActionRunStatus.awaiting_approval,
];
const PAGE_ACTION_KEY_VERSION = 2;
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function sortKeysDeep(value) {
    if (Array.isArray(value)) {
        return value.map(sortKeysDeep);
    }
    if (value && typeof value === 'object') {
        const row = value;
        const sorted = {};
        for (const key of Object.keys(row).sort()) {
            sorted[key] = sortKeysDeep(row[key]);
        }
        return sorted;
    }
    return value;
}
function stableStringify(value) {
    return JSON.stringify(sortKeysDeep(value));
}
function digestText(value) {
    return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
}
function computePageActionKey(input) {
    var _a;
    const actionKey = input.actionKey.trim();
    const instruction = pickString((_a = input.instruction) !== null && _a !== void 0 ? _a : null);
    const pageContext = input.pageContext != null ? sortKeysDeep(input.pageContext) : null;
    const context = input.context && Object.keys(input.context).length > 0
        ? sortKeysDeep(input.context)
        : null;
    const payload = Object.assign(Object.assign(Object.assign({ v: PAGE_ACTION_KEY_VERSION, actionKey }, (pageContext ? { pageContext } : {})), (instruction ? { instruction } : {})), (context ? { context } : {}));
    return digestText(stableStringify(payload));
}
exports.computePageActionKey = computePageActionKey;
//# sourceMappingURL=page-action-key.util.js.map