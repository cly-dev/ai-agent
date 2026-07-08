"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeObservationsJson = exports.resolveObservationBlockPayload = exports.parseObservationsJson = exports.degradeObservations = void 0;
const prompt_budget_constants_1 = require("./prompt-budget.constants");
const INVENTORY_REUSE_NOTE = 'Full output stored in session ledger. Re-call with the same args only if preview is insufficient.';
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function previewLongStringField(record, key, previewChars) {
    const value = record[key];
    if (typeof value !== 'string') {
        return;
    }
    if (value.length <= (0, prompt_budget_constants_1.getPromptObsLongFieldThreshold)()) {
        return;
    }
    record[`${key}Preview`] = `${value.slice(0, previewChars)}…`;
    record[`${key}Length`] = value.length;
    delete record[key];
}
function degradeRecordFields(record, level) {
    const out = Object.assign({}, record);
    for (const key of Object.keys(out)) {
        previewLongStringField(out, key, (0, prompt_budget_constants_1.getPromptObsFieldPreviewChars)());
    }
    out._degraded = { level, mode: 'field_preview' };
    return out;
}
function degradeObservationL1(payload) {
    var _a;
    if (!payload.records || payload.records.length === 0) {
        return payload;
    }
    const maxRecords = (0, prompt_budget_constants_1.getPromptObsMaxRecordsL1)();
    if (payload.records.length <= maxRecords) {
        return payload;
    }
    const records = payload.records.slice(0, maxRecords);
    return Object.assign(Object.assign({}, payload), { records, summary: Object.assign(Object.assign({}, ((_a = payload.summary) !== null && _a !== void 0 ? _a : {})), { matchedCount: records.length, truncated: true, totalRecords: payload.records.length }) });
}
function degradeObservationL2(payload) {
    var _a, _b;
    const summary = (_a = payload.summary) !== null && _a !== void 0 ? _a : {};
    if (summary.mapReduce === true || summary.pageSummaryCount != null) {
        return Object.assign(Object.assign({}, payload), { records: ((_b = payload.records) !== null && _b !== void 0 ? _b : [])
                .slice(0, 3)
                .map((row) => (isRecord(row) ? degradeRecordFields(row, 2) : row)), summary: Object.assign(Object.assign({}, summary), { degraded: true, degradeLevel: 2 }) });
    }
    if (payload.records && payload.records.length > 0) {
        const records = payload.records.map((row) => isRecord(row) ? degradeRecordFields(row, 2) : row);
        return Object.assign(Object.assign({}, payload), { records, summary: Object.assign(Object.assign({}, summary), { matchedCount: records.length, degraded: true, degradeLevel: 2 }) });
    }
    return payload;
}
function degradeObservationL3(payload) {
    var _a, _b, _c, _d, _e, _f;
    const rowCount = (_b = (_a = payload.records) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : (typeof ((_c = payload.summary) === null || _c === void 0 ? void 0 : _c.matchedCount) === 'number'
        ? payload.summary.matchedCount
        : undefined);
    return {
        tool: payload.tool,
        executed: (_d = payload.executed) !== null && _d !== void 0 ? _d : true,
        source: payload.source,
        args: payload.args,
        success: (_e = payload.success) !== null && _e !== void 0 ? _e : true,
        reuseNote: (_f = payload.reuseNote) !== null && _f !== void 0 ? _f : INVENTORY_REUSE_NOTE,
        summary: {
            matchedCount: rowCount !== null && rowCount !== void 0 ? rowCount : 0,
            inventory: true,
            degraded: true,
            degradeLevel: 3,
        },
    };
}
function degradeObservations(observations, level) {
    if (level === 1) {
        return observations.map(degradeObservationL1);
    }
    if (level === 2) {
        return observations.map(degradeObservationL2);
    }
    return observations.map(degradeObservationL3);
}
exports.degradeObservations = degradeObservations;
function parseObservationsJson(raw) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]') {
        return [];
    }
    try {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter((row) => row != null && typeof row === 'object' && typeof row.tool === 'string');
    }
    catch (_a) {
        return [];
    }
}
exports.parseObservationsJson = parseObservationsJson;
function resolveObservationBlockPayload(raw) {
    const observations = parseObservationsJson(raw);
    if (observations.length > 0) {
        return { type: 'observations', observations };
    }
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]') {
        return { type: 'observations', observations: [] };
    }
    return { type: 'text', text: trimmed };
}
exports.resolveObservationBlockPayload = resolveObservationBlockPayload;
function serializeObservationsJson(observations) {
    return JSON.stringify(observations);
}
exports.serializeObservationsJson = serializeObservationsJson;
//# sourceMappingURL=observation-degrade.util.js.map