"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeToolCallArgs = exports.coerceLongIntegerLiteralsToQuotedStrings = void 0;
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);
function isWholeNumberToken(raw) {
    if (raw.length === 0) {
        return false;
    }
    if (raw === '-') {
        return false;
    }
    const body = raw[0] === '-' ? raw.slice(1) : raw;
    if (body.length === 0 || (body[0] === '0' && body.length > 1)) {
        return false;
    }
    return /^[0-9]+$/.test(body);
}
function bigintExceedsSafeRange(intToken) {
    try {
        const bi = BigInt(intToken);
        return bi > MAX_SAFE || bi < MIN_SAFE;
    }
    catch (_a) {
        return false;
    }
}
function coerceLongIntegerLiteralsToQuotedStrings(jsonText) {
    let out = '';
    let i = 0;
    let inString = false;
    let escaped = false;
    while (i < jsonText.length) {
        const c = jsonText[i];
        if (inString) {
            out += c;
            if (escaped) {
                escaped = false;
            }
            else if (c === '\\') {
                escaped = true;
            }
            else if (c === '"') {
                inString = false;
            }
            i += 1;
            continue;
        }
        if (c === '"') {
            inString = true;
            out += c;
            i += 1;
            continue;
        }
        const isNumStart = c === '-' || (c >= '0' && c <= '9');
        if (isNumStart) {
            const start = i;
            let j = i;
            if (jsonText[j] === '-') {
                j += 1;
            }
            if (j >= jsonText.length || jsonText[j] < '0' || jsonText[j] > '9') {
                out += c;
                i += 1;
                continue;
            }
            while (j < jsonText.length && jsonText[j] >= '0' && jsonText[j] <= '9') {
                j += 1;
            }
            const intPart = jsonText.slice(start, j);
            let k = j;
            if (k < jsonText.length && jsonText[k] === '.') {
                k += 1;
                while (k < jsonText.length &&
                    jsonText[k] >= '0' &&
                    jsonText[k] <= '9') {
                    k += 1;
                }
            }
            if (k < jsonText.length && (jsonText[k] === 'e' || jsonText[k] === 'E')) {
                k += 1;
                if (k < jsonText.length &&
                    (jsonText[k] === '+' || jsonText[k] === '-')) {
                    k += 1;
                }
                while (k < jsonText.length &&
                    jsonText[k] >= '0' &&
                    jsonText[k] <= '9') {
                    k += 1;
                }
            }
            if (k > j) {
                out += jsonText.slice(start, k);
                i = k;
                continue;
            }
            if (isWholeNumberToken(intPart) && bigintExceedsSafeRange(intPart)) {
                out += `"${intPart}"`;
            }
            else {
                out += intPart;
            }
            i = j;
            continue;
        }
        out += c;
        i += 1;
    }
    return out;
}
exports.coerceLongIntegerLiteralsToQuotedStrings = coerceLongIntegerLiteralsToQuotedStrings;
function normalizeToolCallArgs(value) {
    if (!value) {
        return {};
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const t = value.trim();
        if (!t) {
            return {};
        }
        try {
            const safeText = coerceLongIntegerLiteralsToQuotedStrings(t);
            const parsed = JSON.parse(safeText);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (_a) {
            return {};
        }
        return {};
    }
    return {};
}
exports.normalizeToolCallArgs = normalizeToolCallArgs;
//# sourceMappingURL=tool-call-args.util.js.map