"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectImageUrlsFromSources = exports.collectImageEntityGroupsFromSources = exports.collectImageEntityGroups = exports.extractEntityContextText = exports.collectImageUrlsFromUnknown = void 0;
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)(?:\?|#|$)/i;
const MIME_IMAGE_RE = /^image\//i;
const GENERIC_ID_KEYS = new Set([
    'id',
    'entityId',
    'entity_id',
    'uuid',
    'key',
]);
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function looksLikeAbsoluteHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch (_a) {
        return false;
    }
}
function siblingSuggestsImage(record) {
    for (const key of ['mimeType', 'contentType', 'content_type', 'type']) {
        const raw = record[key];
        if (typeof raw === 'string' && MIME_IMAGE_RE.test(raw.trim())) {
            return true;
        }
    }
    return false;
}
function considerUrl(url, parent, out) {
    const trimmed = url.trim();
    if (!looksLikeAbsoluteHttpUrl(trimmed)) {
        return;
    }
    if (IMAGE_EXT_RE.test(trimmed) || (parent != null && siblingSuggestsImage(parent))) {
        out.add(trimmed);
    }
}
function walkUrls(value, parent, out, depth) {
    if (depth > 12 || value == null) {
        return;
    }
    if (typeof value === 'string') {
        considerUrl(value, parent, out);
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            walkUrls(item, parent, out, depth + 1);
        }
        return;
    }
    if (!isRecord(value)) {
        return;
    }
    for (const nested of Object.values(value)) {
        walkUrls(nested, value, out, depth + 1);
    }
}
function collectImageUrlsFromUnknown(value) {
    const out = new Set();
    walkUrls(value, null, out, 0);
    return [...out];
}
exports.collectImageUrlsFromUnknown = collectImageUrlsFromUnknown;
function pathJoin(base, segment) {
    if (!base) {
        return segment;
    }
    if (segment.startsWith('[')) {
        return `${base}${segment}`;
    }
    return `${base}.${segment}`;
}
function pickEntityKey(record, path) {
    for (const key of GENERIC_ID_KEYS) {
        const raw = record[key];
        if (typeof raw === 'string' && raw.trim()) {
            return raw.trim().slice(0, 128);
        }
        if (typeof raw === 'number' && Number.isFinite(raw)) {
            return String(raw);
        }
    }
    return path || 'root';
}
function extractEntityContextText(record, maxChars = 800) {
    const parts = [];
    let used = 0;
    for (const [key, raw] of Object.entries(record)) {
        if (GENERIC_ID_KEYS.has(key)) {
            continue;
        }
        if (typeof raw !== 'string') {
            continue;
        }
        const text = raw.trim();
        if (!text || looksLikeAbsoluteHttpUrl(text) || IMAGE_EXT_RE.test(text)) {
            continue;
        }
        if (text.length > 2000) {
            continue;
        }
        const piece = text.length > 400 ? `${text.slice(0, 400)}…` : text;
        if (used + piece.length > maxChars) {
            const room = maxChars - used;
            if (room > 40) {
                parts.push(piece.slice(0, room));
            }
            break;
        }
        parts.push(piece);
        used += piece.length + 1;
    }
    if (parts.length === 0) {
        return undefined;
    }
    return parts.join('\n');
}
exports.extractEntityContextText = extractEntityContextText;
function isArrayOfRecords(value) {
    return (Array.isArray(value) &&
        value.length > 0 &&
        value.every((item) => isRecord(item)));
}
function visitForGroups(value, path, claimed, groups, depth) {
    if (depth > 12 || value == null) {
        return;
    }
    if (isArrayOfRecords(value)) {
        for (let i = 0; i < value.length; i += 1) {
            const item = value[i];
            const itemPath = pathJoin(path, `[${i}]`);
            visitForGroups(item, itemPath, claimed, groups, depth + 1);
            const urls = collectImageUrlsFromUnknown(item).filter((url) => !claimed.has(url));
            if (urls.length === 0) {
                continue;
            }
            for (const url of urls) {
                claimed.add(url);
            }
            groups.push({
                entityKey: pickEntityKey(item, itemPath),
                path: itemPath,
                contextText: extractEntityContextText(item),
                urls,
            });
        }
        return;
    }
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
            visitForGroups(value[i], pathJoin(path, `[${i}]`), claimed, groups, depth + 1);
        }
        return;
    }
    if (isRecord(value)) {
        for (const [key, nested] of Object.entries(value)) {
            visitForGroups(nested, pathJoin(path, key), claimed, groups, depth + 1);
        }
    }
}
function collectImageEntityGroups(value) {
    const claimed = new Set();
    const groups = [];
    visitForGroups(value, '', claimed, groups, 0);
    const orphans = collectImageUrlsFromUnknown(value).filter((url) => !claimed.has(url));
    if (orphans.length > 0) {
        const contextText = isRecord(value)
            ? extractEntityContextText(value)
            : undefined;
        groups.push({
            entityKey: 'root',
            path: '',
            contextText,
            urls: orphans,
        });
    }
    return groups;
}
exports.collectImageEntityGroups = collectImageEntityGroups;
function collectImageEntityGroupsFromSources(input) {
    var _a, _b;
    const merged = [];
    const seenUrl = new Set();
    const append = (source, prefix) => {
        for (const group of collectImageEntityGroups(source)) {
            const urls = group.urls.filter((url) => {
                if (seenUrl.has(url)) {
                    return false;
                }
                seenUrl.add(url);
                return true;
            });
            if (urls.length === 0) {
                continue;
            }
            merged.push(Object.assign(Object.assign({}, group), { path: group.path
                    ? `${prefix}${group.path.startsWith('[') ? '' : '.'}${group.path}`
                    : prefix, entityKey: group.entityKey === 'root' && prefix
                    ? prefix
                    : group.entityKey, urls }));
        }
    };
    if (input.from === 'upstream' || input.from === 'all') {
        append((_a = input.upstreamOutputs) !== null && _a !== void 0 ? _a : {}, 'upstream');
    }
    if (input.from === 'page_context' || input.from === 'all') {
        append((_b = input.pageContext) !== null && _b !== void 0 ? _b : null, 'page_context');
    }
    return merged;
}
exports.collectImageEntityGroupsFromSources = collectImageEntityGroupsFromSources;
function collectImageUrlsFromSources(input) {
    return collectImageEntityGroupsFromSources(input).flatMap((row) => row.urls);
}
exports.collectImageUrlsFromSources = collectImageUrlsFromSources;
//# sourceMappingURL=collect-image-urls.util.js.map