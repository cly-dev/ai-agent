"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageContextEntityIdForPlanSatisfaction = exports.resolveEffectivePageContextApplies = exports.mergePageContextPreloadedObservations = exports.materializePageContextObservations = exports.pageContextObservationMatchesEntity = exports.readEntityIdFromPageContextObservation = exports.isPageContextSourcedObservation = exports.buildPageContextRouteHint = exports.assessPageContextData = void 0;
const page_context_metadata_scan_util_1 = require("./page-context-metadata-scan.util");
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function assessPageContextData(pageContext) {
    var _a;
    if (!pageContext) {
        return {
            page: null,
            entityType: null,
            entityId: null,
            dataSufficiency: 'none',
            inlineContentKinds: [],
        };
    }
    const page = pickString(pageContext.page);
    const entityType = pickString((_a = pageContext.entity) === null || _a === void 0 ? void 0 : _a.type);
    const entityId = (0, page_context_metadata_scan_util_1.resolvePageContextEntityId)(pageContext);
    const inlineRecords = (0, page_context_metadata_scan_util_1.readInlineRecordsFromPageContext)(pageContext);
    const inlineContentKinds = inlineRecords.map((row) => row.kind);
    let dataSufficiency = 'none';
    if (inlineContentKinds.length > 0) {
        dataSufficiency = 'inline';
    }
    else if (entityId) {
        dataSufficiency = 'entity_only';
    }
    return {
        page,
        entityType,
        entityId,
        dataSufficiency,
        inlineContentKinds,
    };
}
exports.assessPageContextData = assessPageContextData;
function buildPageContextRouteHint(pageContext) {
    const assessment = assessPageContextData(pageContext);
    if (!assessment.page &&
        assessment.dataSufficiency === 'none' &&
        !assessment.entityId) {
        return null;
    }
    return {
        page: assessment.page,
        entityType: assessment.entityType,
        entityId: assessment.entityId,
        dataSufficiency: assessment.dataSufficiency,
        inlineContentKinds: assessment.inlineContentKinds,
    };
}
exports.buildPageContextRouteHint = buildPageContextRouteHint;
function isPageContextSourcedObservation(input) {
    if (input.name.startsWith('page_context:')) {
        return true;
    }
    if (!isRecord(input.output)) {
        return false;
    }
    return input.output.source === 'page_context';
}
exports.isPageContextSourcedObservation = isPageContextSourcedObservation;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readEntityIdFromPageContextObservation(output) {
    if (!isRecord(output)) {
        return null;
    }
    const topLevel = pickString(output.entityId);
    if (topLevel) {
        return topLevel;
    }
    const data = output.data;
    if (isRecord(data)) {
        return pickString(data.id);
    }
    const records = output.records;
    if (Array.isArray(records) && records.length > 0 && isRecord(records[0])) {
        return pickString(records[0].id);
    }
    return null;
}
exports.readEntityIdFromPageContextObservation = readEntityIdFromPageContextObservation;
function pageContextObservationMatchesEntity(input) {
    if (!isPageContextSourcedObservation(input.observation)) {
        return false;
    }
    if (!input.entityId) {
        return false;
    }
    const obsEntityId = readEntityIdFromPageContextObservation(input.observation.output);
    return obsEntityId != null && obsEntityId === input.entityId;
}
exports.pageContextObservationMatchesEntity = pageContextObservationMatchesEntity;
function buildMaterializedObservation(input) {
    const observationName = (0, page_context_metadata_scan_util_1.buildPageContextObservationName)(input.kind);
    const output = {
        source: 'page_context',
        entityType: input.entityType,
        entityId: input.entityId,
        page: input.page,
        records: [input.record],
        data: input.record,
        summary: {
            total: 1,
            source: 'page_context_inline',
            entityType: input.entityType,
        },
    };
    return {
        name: observationName,
        output,
        llmPayload: {
            tool: observationName,
            executed: true,
            source: 'session',
            success: true,
            reuseNote: 'Inline entity data from page_context. Do not call read-list or read-detail for the same entity unless the user explicitly requests a server refresh.',
            records: [input.record],
            summary: {
                total: 1,
                source: 'page_context_inline',
            },
        },
    };
}
function materializePageContextObservations(pageContext) {
    if (!pageContext) {
        return [];
    }
    const assessment = assessPageContextData(pageContext);
    const inlineRecords = (0, page_context_metadata_scan_util_1.readInlineRecordsFromPageContext)(pageContext);
    if (inlineRecords.length === 0) {
        return [];
    }
    return inlineRecords.map((row) => {
        var _a, _b;
        const entityId = (_a = pickString(row.record.id)) !== null && _a !== void 0 ? _a : assessment.entityId;
        const entityType = (_b = assessment.entityType) !== null && _b !== void 0 ? _b : row.kind;
        return buildMaterializedObservation({
            kind: row.kind,
            record: row.record,
            entityType,
            entityId,
            page: assessment.page,
        });
    });
}
exports.materializePageContextObservations = materializePageContextObservations;
function mergePageContextPreloadedObservations(existing, pageContext) {
    const materialized = materializePageContextObservations(pageContext);
    if (materialized.length === 0) {
        return existing;
    }
    const withoutPageContext = existing.filter((row) => !isPageContextSourcedObservation(row));
    return [...withoutPageContext, ...materialized];
}
exports.mergePageContextPreloadedObservations = mergePageContextPreloadedObservations;
function resolveEffectivePageContextApplies(input) {
    if (input.route === 'direct_answer') {
        return false;
    }
    if (input.pageContextApplies) {
        return true;
    }
    if (input.method !== 'fallback_orchestrated') {
        return false;
    }
    const assessment = assessPageContextData(input.pageContext);
    return (input.route === 'orchestrated_task' &&
        assessment.dataSufficiency === 'inline');
}
exports.resolveEffectivePageContextApplies = resolveEffectivePageContextApplies;
function resolvePageContextEntityIdForPlanSatisfaction(input) {
    var _a, _b;
    if (((_a = input.pageContextUsage) === null || _a === void 0 ? void 0 : _a.applies) && input.pageContextUsage.entityId) {
        return input.pageContextUsage.entityId;
    }
    if (!((_b = input.pageContextUsage) === null || _b === void 0 ? void 0 : _b.applies)) {
        return null;
    }
    return assessPageContextData(input.pageContext).entityId;
}
exports.resolvePageContextEntityIdForPlanSatisfaction = resolvePageContextEntityIdForPlanSatisfaction;
//# sourceMappingURL=page-context-usage.util.js.map