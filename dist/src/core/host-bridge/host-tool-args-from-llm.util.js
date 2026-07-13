"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHostToolArgsDisplayText = exports.parseHostToolArgsFromLlmText = exports.softValidateHostToolArgsAgainstSchema = exports.extractJsonObjectFromLlmText = void 0;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function extractJsonObjectFromLlmText(content) {
    var _a, _b;
    const trimmed = content.trim();
    if (!trimmed) {
        return null;
    }
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (_b = (_a = fenced === null || fenced === void 0 ? void 0 : fenced[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : trimmed;
    try {
        const parsed = JSON.parse(candidate);
        return isRecord(parsed) ? parsed : null;
    }
    catch (_c) {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return null;
        }
        try {
            const parsed = JSON.parse(candidate.slice(start, end + 1));
            return isRecord(parsed) ? parsed : null;
        }
        catch (_d) {
            return null;
        }
    }
}
exports.extractJsonObjectFromLlmText = extractJsonObjectFromLlmText;
function typeTokenMatches(value, typeToken) {
    switch (typeToken) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && Number.isFinite(value);
        case 'integer':
            return typeof value === 'number' && Number.isInteger(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'array':
            return Array.isArray(value);
        case 'object':
            return isRecord(value);
        case 'null':
            return value === null;
        default:
            return true;
    }
}
function valueMatchesPropDef(value, def) {
    const type = def.type;
    if (typeof type === 'string') {
        return typeTokenMatches(value, type);
    }
    if (Array.isArray(type) && type.length > 0) {
        return type.some((token) => typeof token === 'string' && typeTokenMatches(value, token));
    }
    if (def.items != null) {
        return Array.isArray(value);
    }
    if (isRecord(def.properties)) {
        return isRecord(value);
    }
    return true;
}
function softValidateHostToolArgsAgainstSchema(args, argsSchema) {
    const properties = isRecord(argsSchema.properties)
        ? argsSchema.properties
        : null;
    const required = argsSchema.required;
    if (!Array.isArray(required) || required.length === 0) {
        if (Object.keys(args).length === 0) {
            return false;
        }
        if (!properties) {
            return true;
        }
        for (const [key, value] of Object.entries(args)) {
            const def = properties[key];
            if (isRecord(def) && !valueMatchesPropDef(value, def)) {
                return false;
            }
        }
        return true;
    }
    for (const key of required) {
        if (typeof key !== 'string' || key.length === 0) {
            continue;
        }
        if (!(key in args)) {
            return false;
        }
        const def = properties === null || properties === void 0 ? void 0 : properties[key];
        if (isRecord(def) && !valueMatchesPropDef(args[key], def)) {
            return false;
        }
    }
    return true;
}
exports.softValidateHostToolArgsAgainstSchema = softValidateHostToolArgsAgainstSchema;
function parseHostToolArgsFromLlmText(input) {
    const args = extractJsonObjectFromLlmText(input.text);
    if (!args) {
        return null;
    }
    if (!softValidateHostToolArgsAgainstSchema(args, input.argsSchema)) {
        return null;
    }
    return args;
}
exports.parseHostToolArgsFromLlmText = parseHostToolArgsFromLlmText;
const DISPLAY_STRING_CAP = 12;
const DISPLAY_CHAR_CAP = 4000;
function buildHostToolArgsDisplayText(args) {
    const leaves = [];
    const visit = (value) => {
        if (leaves.length >= DISPLAY_STRING_CAP) {
            return;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
                leaves.push(trimmed);
            }
            return;
        }
        if (Array.isArray(value)) {
            for (const item of value) {
                visit(item);
                if (leaves.length >= DISPLAY_STRING_CAP) {
                    return;
                }
            }
            return;
        }
        if (isRecord(value)) {
            for (const child of Object.values(value)) {
                visit(child);
                if (leaves.length >= DISPLAY_STRING_CAP) {
                    return;
                }
            }
        }
    };
    visit(args);
    if (leaves.length === 0) {
        return JSON.stringify(args);
    }
    const joined = leaves.join('\n\n');
    if (joined.length <= DISPLAY_CHAR_CAP) {
        return joined;
    }
    return `${joined.slice(0, DISPLAY_CHAR_CAP)}…`;
}
exports.buildHostToolArgsDisplayText = buildHostToolArgsDisplayText;
//# sourceMappingURL=host-tool-args-from-llm.util.js.map