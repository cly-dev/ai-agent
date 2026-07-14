"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deserializePendingObservations = exports.serializeObservationsForPending = void 0;
function serializeObservationsForPending(observations) {
    return observations.map((observation) => ({
        name: observation.name,
        output: observation.output,
        llmPayload: observation.llmPayload,
        quality: observation.quality,
        fieldLabels: observation.fieldLabels,
        fieldDescriptions: observation.fieldDescriptions,
        enumLabelsByPath: observation.enumLabelsByPath,
    }));
}
exports.serializeObservationsForPending = serializeObservationsForPending;
function deserializePendingObservations(rows) {
    return rows.map((row) => ({
        name: row.name,
        output: row.output,
        llmPayload: row.llmPayload,
        quality: row.quality,
        fieldLabels: row.fieldLabels,
        fieldDescriptions: row.fieldDescriptions,
        enumLabelsByPath: row.enumLabelsByPath,
    }));
}
exports.deserializePendingObservations = deserializePendingObservations;
//# sourceMappingURL=agent-write-confirmation.util.js.map