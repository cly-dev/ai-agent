"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApprovalResumeNodeDefs = exports.isApprovalResumeSnapshotV2 = void 0;
function isApprovalResumeSnapshotV2(snapshot) {
    return snapshot.version === 2;
}
exports.isApprovalResumeSnapshotV2 = isApprovalResumeSnapshotV2;
function resolveApprovalResumeNodeDefs(snapshot, reloadedNodes) {
    var _a;
    if (reloadedNodes && reloadedNodes.length > 0) {
        return reloadedNodes;
    }
    if (isApprovalResumeSnapshotV2(snapshot)) {
        return (_a = snapshot.workflowNodeDefs) !== null && _a !== void 0 ? _a : [];
    }
    return snapshot.workflowNodeDefs;
}
exports.resolveApprovalResumeNodeDefs = resolveApprovalResumeNodeDefs;
//# sourceMappingURL=approval-resume-snapshot.types.js.map