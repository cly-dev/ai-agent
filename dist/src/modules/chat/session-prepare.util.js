"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSessionRuntimeSnapshotValid = exports.snapshotContainsAnyToolId = exports.areSessionRuntimeRevisionsEqual = exports.buildSessionRuntimeRevision = void 0;
const runtime_revision_util_1 = require("../../core/runtime-cache/runtime-revision.util");
function buildSessionRuntimeRevision(input) {
    var _a;
    const toolParts = (0, runtime_revision_util_1.buildToolsRuntimeRevision)(input.tools);
    return {
        tools: toolParts.tools,
        integrations: toolParts.integrations,
        skills: (0, runtime_revision_util_1.buildSkillsRuntimeRevision)(input.skills),
        hostTools: (_a = input.hostToolsRevision) !== null && _a !== void 0 ? _a : '',
    };
}
exports.buildSessionRuntimeRevision = buildSessionRuntimeRevision;
function areSessionRuntimeRevisionsEqual(cached, fresh) {
    return (0, runtime_revision_util_1.isRuntimeRevisionEqual)(cached, fresh);
}
exports.areSessionRuntimeRevisionsEqual = areSessionRuntimeRevisionsEqual;
function snapshotContainsAnyToolId(tools, toolIds) {
    const idSet = new Set(toolIds);
    return tools.some((tool) => idSet.has(tool.id));
}
exports.snapshotContainsAnyToolId = snapshotContainsAnyToolId;
function isSessionRuntimeSnapshotValid(snapshot, expected) {
    return (snapshot.sessionId === expected.sessionId &&
        snapshot.userId === expected.userId &&
        snapshot.appClientId === expected.appClientId &&
        snapshot.agentId === expected.agentId &&
        Array.isArray(snapshot.tools));
}
exports.isSessionRuntimeSnapshotValid = isSessionRuntimeSnapshotValid;
//# sourceMappingURL=session-prepare.util.js.map