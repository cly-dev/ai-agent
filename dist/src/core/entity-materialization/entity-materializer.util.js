"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveImageUrlsForVision = exports.collectImageUrlsFromMaterializedEntities = exports.mergeMaterializedEntities = exports.materializeEntitiesFromToolOutput = exports.materializeEntitiesFromRuntimeContext = void 0;
const page_context_metadata_scan_util_1 = require("../host-bridge/page-context-metadata-scan.util");
const collect_image_urls_util_1 = require("../image-panel/collect-image-urls.util");
const entity_fingerprint_util_1 = require("./entity-fingerprint.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function pathJoin(base, segment) {
    if (!base) {
        return segment;
    }
    if (segment.startsWith('[')) {
        return `${base}${segment}`;
    }
    return `${base}.${segment}`;
}
function getByPath(root, path) {
    if (!path.trim()) {
        return root;
    }
    let current = root;
    for (const segment of path.split('.').filter(Boolean)) {
        if (!isRecord(current)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}
function extractTextFromRecord(record) {
    const content = pickString(record.content);
    if (content) {
        return content.slice(0, 4000);
    }
    return (0, collect_image_urls_util_1.extractEntityContextText)(record, 1200);
}
function recordQualifiesAsEntity(record) {
    const text = extractTextFromRecord(record);
    const imageUrls = (0, collect_image_urls_util_1.collectImageUrlsFromUnknown)(record);
    return (text != null && text.length > 0) || imageUrls.length > 0;
}
function buildFieldsProjection(record) {
    const out = {};
    for (const [key, value] of Object.entries(record)) {
        if (key === 'content') {
            continue;
        }
        if (typeof value === 'string' && value.length <= 800) {
            out[key] = value;
        }
        else if (typeof value === 'number' || typeof value === 'boolean') {
            out[key] = value;
        }
        else if (Array.isArray(value) &&
            value.length > 0 &&
            value.length <= 12 &&
            value.every((row) => typeof row === 'string' || typeof row === 'number')) {
            out[key] = value;
        }
    }
    return out;
}
class EntityKeyAllocator {
    constructor() {
        this.next = 0;
        this.usedFingerprints = new Set();
    }
    allocate(fingerprint) {
        let fp = fingerprint;
        let suffix = 2;
        while (this.usedFingerprints.has(fp)) {
            fp = `${fingerprint}_${suffix}`;
            suffix += 1;
        }
        this.usedFingerprints.add(fp);
        this.next += 1;
        return {
            entityKey: `ent_${String(this.next).padStart(3, '0')}`,
            fingerprint: fp,
        };
    }
}
function pushEntity(allocator, seen, out, input) {
    const slot = `${input.source}:${input.path}`;
    if (seen.has(slot)) {
        return;
    }
    if (!recordQualifiesAsEntity(input.record)) {
        return;
    }
    seen.add(slot);
    const fingerprint = (0, entity_fingerprint_util_1.buildEntityFingerprint)({
        source: input.source,
        path: input.path,
    });
    const ids = allocator.allocate(fingerprint);
    const text = extractTextFromRecord(input.record);
    const imageUrls = (0, collect_image_urls_util_1.collectImageUrlsFromUnknown)(input.record);
    out.push({
        entityKey: ids.entityKey,
        fingerprint: ids.fingerprint,
        entityType: input.entityType,
        source: input.source,
        path: input.path,
        content: Object.assign(Object.assign({}, (text ? { text } : {})), { fields: buildFieldsProjection(input.record) }),
        assets: imageUrls.length > 0 ? { imageUrls } : {},
    });
}
function isArrayOfRecords(value) {
    return (Array.isArray(value) &&
        value.length > 0 &&
        value.every((row) => isRecord(row)));
}
function visitStructural(value, path, source, entityTypeHint, allocator, seen, out, depth) {
    if (depth > 12 || value == null) {
        return;
    }
    if (isArrayOfRecords(value)) {
        for (let i = 0; i < value.length; i += 1) {
            const item = value[i];
            const itemPath = pathJoin(path, `[${i}]`);
            pushEntity(allocator, seen, out, {
                source,
                path: itemPath,
                entityType: entityTypeHint,
                record: item,
            });
            visitStructural(item, itemPath, source, entityTypeHint, allocator, seen, out, depth + 1);
        }
        return;
    }
    if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
            visitStructural(value[i], pathJoin(path, `[${i}]`), source, entityTypeHint, allocator, seen, out, depth + 1);
        }
        return;
    }
    if (!isRecord(value)) {
        return;
    }
    if (path) {
        pushEntity(allocator, seen, out, {
            source,
            path,
            entityType: entityTypeHint,
            record: value,
        });
    }
    for (const [key, nested] of Object.entries(value)) {
        if (key === 'metadata' && source === 'page_context' && path === '') {
            continue;
        }
        visitStructural(nested, pathJoin(path, key), source, entityTypeHint, allocator, seen, out, depth + 1);
    }
}
function materializeEntitiesFromRuntimeContext(input) {
    var _a, _b, _c;
    const allocator = new EntityKeyAllocator();
    const seen = new Set();
    const out = [];
    const pageEntityType = (_c = pickString((_b = (_a = input.pageContext) === null || _a === void 0 ? void 0 : _a.entity) === null || _b === void 0 ? void 0 : _b.type)) !== null && _c !== void 0 ? _c : 'entity';
    if (input.pageContext) {
        for (const row of (0, page_context_metadata_scan_util_1.readInlineRecordsFromPageContext)(input.pageContext)) {
            pushEntity(allocator, seen, out, {
                source: 'page_context',
                path: `metadata.${row.kind}`,
                entityType: pageEntityType !== 'entity' ? pageEntityType : row.kind,
                record: row.record,
            });
        }
        visitStructural(input.pageContext, '', 'page_context', pageEntityType, allocator, seen, out, 0);
    }
    if (input.actionContext && Object.keys(input.actionContext).length > 0) {
        pushEntity(allocator, seen, out, {
            source: 'action_context',
            path: '',
            entityType: pageEntityType,
            record: input.actionContext,
        });
        visitStructural(input.actionContext, '', 'action_context', pageEntityType, allocator, seen, out, 0);
    }
    return out;
}
exports.materializeEntitiesFromRuntimeContext = materializeEntitiesFromRuntimeContext;
function materializeEntitiesFromToolOutput(input) {
    var _a, _b, _c;
    if (input.raw == null) {
        return [];
    }
    const allocator = new EntityKeyAllocator();
    const seen = new Set();
    const out = [];
    const entityType = (_b = pickString((_a = input.profile) === null || _a === void 0 ? void 0 : _a.entityType)) !== null && _b !== void 0 ? _b : 'entity';
    if ((_c = input.profile) === null || _c === void 0 ? void 0 : _c.listPath) {
        const listValue = getByPath(input.raw, input.profile.listPath);
        if (!Array.isArray(listValue)) {
            return [];
        }
        const listPath = input.profile.listPath;
        for (let i = 0; i < listValue.length; i += 1) {
            const row = listValue[i];
            if (!isRecord(row)) {
                continue;
            }
            pushEntity(allocator, seen, out, {
                source: 'upstream',
                path: `${listPath}[${i}]`,
                entityType,
                record: row,
            });
        }
        return out;
    }
    if (isRecord(input.raw)) {
        pushEntity(allocator, seen, out, {
            source: 'upstream',
            path: '',
            entityType,
            record: input.raw,
        });
    }
    return out;
}
exports.materializeEntitiesFromToolOutput = materializeEntitiesFromToolOutput;
function mergeMaterializedEntities(existing, incoming) {
    const seen = new Set(existing.map((row) => `${row.source}:${row.path}`));
    const merged = [...existing];
    for (const row of incoming) {
        const slot = `${row.source}:${row.path}`;
        if (seen.has(slot)) {
            continue;
        }
        seen.add(slot);
        merged.push(row);
    }
    return merged;
}
exports.mergeMaterializedEntities = mergeMaterializedEntities;
function collectImageUrlsFromMaterializedEntities(entities, sources) {
    var _a;
    const sourceSet = new Set(sources);
    const urls = [];
    const seen = new Set();
    for (const entity of entities) {
        if (!sourceSet.has(entity.source)) {
            continue;
        }
        for (const url of (_a = entity.assets.imageUrls) !== null && _a !== void 0 ? _a : []) {
            if (seen.has(url)) {
                continue;
            }
            seen.add(url);
            urls.push(url);
        }
    }
    return urls;
}
exports.collectImageUrlsFromMaterializedEntities = collectImageUrlsFromMaterializedEntities;
function sourcesForVisionFrom(from) {
    if (from === 'upstream') {
        return ['upstream'];
    }
    if (from === 'page_context') {
        return ['page_context', 'action_context'];
    }
    return ['page_context', 'action_context', 'upstream'];
}
function resolveImageUrlsForVision(input) {
    if (input.entities && input.entities.length > 0) {
        const urls = collectImageUrlsFromMaterializedEntities(input.entities, sourcesForVisionFrom(input.from));
        if (urls.length > 0) {
            return urls;
        }
    }
    return (0, collect_image_urls_util_1.collectImageUrlsFromSources)({
        from: input.from,
        pageContext: input.pageContext,
        upstreamOutputs: input.upstreamOutputs,
    });
}
exports.resolveImageUrlsForVision = resolveImageUrlsForVision;
//# sourceMappingURL=entity-materializer.util.js.map