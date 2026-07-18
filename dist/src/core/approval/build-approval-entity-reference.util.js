"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApprovalEntityReferenceFromSnapshot = void 0;
const page_context_usage_util_1 = require("../host-bridge/page-context-usage.util");
const page_context_metadata_scan_util_1 = require("../host-bridge/page-context-metadata-scan.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function pickString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function parseObservationAction(ref) {
    var _a;
    const match = /^obs:([^:]+):/.exec(ref.trim());
    return (_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : null;
}
function readFetchDataSource(ref, value) {
    var _a;
    if (!isRecord(value)) {
        return null;
    }
    const toolName = pickString(value.toolName);
    const toolId = typeof value.toolId === 'number' ? value.toolId : null;
    const output = (_a = value.output) !== null && _a !== void 0 ? _a : value;
    if (output === undefined) {
        return null;
    }
    return {
        ref,
        action: 'fetch_data',
        toolName,
        toolId,
        data: output,
    };
}
function collectWorkflowSources(workflowNodeOutputs) {
    const sources = [];
    for (const [ref, value] of Object.entries(workflowNodeOutputs)) {
        const action = parseObservationAction(ref);
        if (action === 'fetch_data') {
            const row = readFetchDataSource(ref, value);
            if (row) {
                sources.push(row);
            }
            continue;
        }
        if (action === 'summarize_images') {
            sources.push({
                ref,
                action: 'summarize_images',
                toolName: null,
                toolId: null,
                data: value,
            });
        }
    }
    return sources.sort((left, right) => left.ref.localeCompare(right.ref));
}
function buildApprovalEntityReferenceFromSnapshot(snapshotInput) {
    var _a, _b;
    const snapshot = snapshotInput;
    const pageContext = ((_a = snapshot === null || snapshot === void 0 ? void 0 : snapshot.pageContext) !== null && _a !== void 0 ? _a : null);
    const assessment = (0, page_context_usage_util_1.assessPageContextData)(pageContext);
    const inlineRecords = pageContext
        ? (0, page_context_metadata_scan_util_1.readInlineRecordsFromPageContext)(pageContext).map((row) => ({
            kind: row.kind,
            record: row.record,
        }))
        : [];
    const workflowSources = collectWorkflowSources((_b = snapshot === null || snapshot === void 0 ? void 0 : snapshot.workflowNodeOutputs) !== null && _b !== void 0 ? _b : {});
    return {
        page: assessment.page,
        routePath: pickString(pageContext === null || pageContext === void 0 ? void 0 : pageContext.routePath),
        entityType: assessment.entityType,
        entityId: assessment.entityId,
        inlineRecords,
        sources: workflowSources,
    };
}
exports.buildApprovalEntityReferenceFromSnapshot = buildApprovalEntityReferenceFromSnapshot;
//# sourceMappingURL=build-approval-entity-reference.util.js.map