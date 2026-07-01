"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHostToolStringArgKey = exports.readHostToolStringArg = exports.pickHostToolStringArgKey = exports.HOST_TOOL_STRING_ARG_KEYS = void 0;
exports.HOST_TOOL_STRING_ARG_KEYS = [
    'text',
    'content',
    'value',
    'draft',
    'body',
];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function pickHostToolStringArgKey(properties) {
    for (const key of exports.HOST_TOOL_STRING_ARG_KEYS) {
        const def = properties[key];
        if (isRecord(def) && def.type === 'string') {
            return key;
        }
    }
    for (const [key, def] of Object.entries(properties)) {
        if (isRecord(def) && def.type === 'string') {
            return key;
        }
    }
    return null;
}
exports.pickHostToolStringArgKey = pickHostToolStringArgKey;
function readHostToolStringArg(args) {
    for (const key of exports.HOST_TOOL_STRING_ARG_KEYS) {
        const value = args[key];
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
                return trimmed;
            }
        }
    }
    return null;
}
exports.readHostToolStringArg = readHostToolStringArg;
function resolveHostToolStringArgKey(args) {
    for (const key of exports.HOST_TOOL_STRING_ARG_KEYS) {
        if (key in args) {
            return key;
        }
    }
    return 'text';
}
exports.resolveHostToolStringArgKey = resolveHostToolStringArgKey;
//# sourceMappingURL=host-tool-string-arg.util.js.map