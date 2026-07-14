"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripLegacyGoaFieldsFromContext = void 0;
function stripLegacyGoaFieldsFromContext(current) {
    const next = Object.assign({}, current);
    delete next.recentEpisodes;
    delete next.sessionArtifacts;
    delete next.taskState;
    delete next.resumeTaskPlan;
    delete next.observationSnapshots;
    delete next.workingMemory;
    return next;
}
exports.stripLegacyGoaFieldsFromContext = stripLegacyGoaFieldsFromContext;
//# sourceMappingURL=session-goa-legacy-cleanup.util.js.map