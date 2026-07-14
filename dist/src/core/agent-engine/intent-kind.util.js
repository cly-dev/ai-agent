"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectIntentKind = void 0;
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function matchesSmallTalkHint(normalized, configurableHints) {
    for (const hint of configurableHints) {
        const token = hint.trim().toLowerCase();
        if (!token) {
            continue;
        }
        if (normalized === token) {
            return true;
        }
        if (new RegExp(`^${escapeRegExp(token)}[\\s!.?,，？]*$`, 'iu').test(normalized)) {
            return true;
        }
    }
    return false;
}
function detectIntentKind(userMessage, configurableHints = []) {
    const text = userMessage.trim();
    if (!text) {
        return 'unclear';
    }
    if (!/[\p{L}\p{N}]/u.test(text)) {
        return 'unclear';
    }
    const normalized = text.toLowerCase();
    if (matchesSmallTalkHint(normalized, configurableHints)) {
        return 'smalltalk';
    }
    return 'task';
}
exports.detectIntentKind = detectIntentKind;
//# sourceMappingURL=intent-kind.util.js.map