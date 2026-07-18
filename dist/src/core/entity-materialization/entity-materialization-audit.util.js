"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeEntityEvidencesForAudit = exports.serializeEntitiesForAudit = void 0;
const MAX_TEXT_AUDIT = 400;
const MAX_FIELD_COUNT = 24;
function truncate(value, max = MAX_TEXT_AUDIT) {
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, max)}…`;
}
function serializeEntitiesForAudit(entities) {
    return {
        count: entities.length,
        entities: entities.map((row) => {
            var _a, _b, _c;
            return ({
                entityKey: row.entityKey,
                fingerprint: row.fingerprint,
                entityType: row.entityType,
                source: row.source,
                path: row.path,
                content: {
                    text: row.content.text ? truncate(row.content.text) : undefined,
                    fieldKeys: Object.keys((_a = row.content.fields) !== null && _a !== void 0 ? _a : {}).slice(0, MAX_FIELD_COUNT),
                    fields: row.content.fields,
                },
                imageUrlCount: (_c = (_b = row.assets.imageUrls) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0,
                imageUrls: row.assets.imageUrls,
            });
        }),
    };
}
exports.serializeEntitiesForAudit = serializeEntitiesForAudit;
function serializeEntityEvidencesForAudit(bundles) {
    return {
        count: bundles.length,
        bundles: bundles.map((row) => ({
            entityKey: row.entityKey,
            evidence: row.evidence.map((item) => summarizeEvidenceItem(item)),
        })),
    };
}
exports.serializeEntityEvidencesForAudit = serializeEntityEvidencesForAudit;
function summarizeEvidenceItem(item) {
    var _a, _b;
    return {
        type: item.type,
        source: item.source,
        summary: item.summary ? truncate(item.summary) : undefined,
        urlCount: (_b = (_a = item.urls) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
        legible: item.legible,
    };
}
//# sourceMappingURL=entity-materialization-audit.util.js.map