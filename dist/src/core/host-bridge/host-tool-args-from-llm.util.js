"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHostToolArgsDisplayText = exports.parseHostToolArgsFromLlmTextCandidates = exports.parseHostToolArgsFromLlmText = exports.parseHostToolArgsFromLlmTextDetailed = exports.unwrapHostToolArgsEnvelope = exports.softValidateHostToolArgsAgainstSchema = exports.extractJsonObjectFromLlmText = void 0;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function stripMarkdownFences(text) {
    const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
    if (fenced === null || fenced === void 0 ? void 0 : fenced[1]) {
        return fenced[1].trim();
    }
    const open = text.match(/^```(?:json|JSON)?\s*\r?\n?([\s\S]*)$/);
    if (open === null || open === void 0 ? void 0 : open[1]) {
        return open[1].replace(/```\s*$/, '').trim();
    }
    return text;
}
function stripLeadingLanguageTag(text) {
    return text.replace(/^(json|JSON|javascript|JavaScript)\s*\r?\n/, '');
}
function extractBalancedJsonObjectSlices(text) {
    const out = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (ch === '{') {
            if (depth === 0) {
                start = i;
            }
            depth += 1;
        }
        else if (ch === '}') {
            if (depth === 0) {
                continue;
            }
            depth -= 1;
            if (depth === 0 && start >= 0) {
                out.push(text.slice(start, i + 1));
                start = -1;
            }
        }
    }
    return out;
}
function tryParseJsonRecord(candidate) {
    try {
        const parsed = JSON.parse(candidate);
        return isRecord(parsed) ? parsed : null;
    }
    catch (_a) {
        return null;
    }
}
function extractJsonObjectFromLlmText(content) {
    const trimmed = content.trim();
    if (!trimmed) {
        return null;
    }
    const withoutFence = stripMarkdownFences(trimmed);
    const candidate = stripLeadingLanguageTag(withoutFence.trim());
    const direct = tryParseJsonRecord(candidate);
    if (direct) {
        return direct;
    }
    const slices = extractBalancedJsonObjectSlices(candidate);
    for (let i = slices.length - 1; i >= 0; i -= 1) {
        const parsed = tryParseJsonRecord(slices[i]);
        if (parsed) {
            return parsed;
        }
    }
    return null;
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
function unwrapHostToolArgsEnvelope(parsed, argsSchema) {
    if (softValidateHostToolArgsAgainstSchema(parsed, argsSchema)) {
        return parsed;
    }
    const keys = Object.keys(parsed);
    if (keys.length === 1) {
        const inner = parsed[keys[0]];
        if (isRecord(inner) && softValidateHostToolArgsAgainstSchema(inner, argsSchema)) {
            return inner;
        }
    }
    for (const value of Object.values(parsed)) {
        if (isRecord(value) && softValidateHostToolArgsAgainstSchema(value, argsSchema)) {
            return value;
        }
    }
    return parsed;
}
exports.unwrapHostToolArgsEnvelope = unwrapHostToolArgsEnvelope;
function parseHostToolArgsFromLlmTextDetailed(input) {
    const preview = input.text.trim().slice(0, 240);
    const extracted = extractJsonObjectFromLlmText(input.text);
    if (!extracted) {
        return { ok: false, reason: 'parse_failed', preview };
    }
    const args = unwrapHostToolArgsEnvelope(extracted, input.argsSchema);
    if (!softValidateHostToolArgsAgainstSchema(args, input.argsSchema)) {
        return { ok: false, reason: 'validate_failed', preview };
    }
    return { ok: true, args };
}
exports.parseHostToolArgsFromLlmTextDetailed = parseHostToolArgsFromLlmTextDetailed;
function parseHostToolArgsFromLlmText(input) {
    const detailed = parseHostToolArgsFromLlmTextDetailed(input);
    return detailed.ok ? detailed.args : null;
}
exports.parseHostToolArgsFromLlmText = parseHostToolArgsFromLlmText;
function parseHostToolArgsFromLlmTextCandidates(input) {
    let lastFail = {
        ok: false,
        reason: 'parse_failed',
        preview: '',
    };
    for (const candidate of input.candidates) {
        const text = candidate === null || candidate === void 0 ? void 0 : candidate.trim();
        if (!text) {
            continue;
        }
        const result = parseHostToolArgsFromLlmTextDetailed({
            text,
            argsSchema: input.argsSchema,
        });
        if (result.ok) {
            return result;
        }
        lastFail = result;
    }
    return lastFail;
}
exports.parseHostToolArgsFromLlmTextCandidates = parseHostToolArgsFromLlmTextCandidates;
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