"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApprovalWriteDraftPayload = exports.extractWriteDraftPublicFromApprovalRow = exports.resolveApprovalRowToolId = void 0;
const resolve_write_draft_edit_policy_util_1 = require("../../core/draft-review/resolve-write-draft-edit-policy.util");
const write_draft_util_1 = require("../../core/draft-review/write-draft.util");
function resolveApprovalRowToolId(row) {
    var _a, _b;
    const snapshot = row.resumeSnapshot;
    const toolId = (_b = (_a = snapshot.writeDraft) === null || _a === void 0 ? void 0 : _a.tool) === null || _b === void 0 ? void 0 : _b.toolId;
    return typeof toolId === 'number' && toolId > 0 ? toolId : null;
}
exports.resolveApprovalRowToolId = resolveApprovalRowToolId;
function extractWriteDraftPublicFromApprovalRow(row) {
    var _a;
    const snapshot = row.resumeSnapshot;
    const previewBlocks = Array.isArray(row.previewBlocks)
        ? row.previewBlocks
        : null;
    const draft = (0, write_draft_util_1.resolveWriteDraftFromApprovalSnapshot)(snapshot, {
        summary: (_a = row.summary) !== null && _a !== void 0 ? _a : null,
        previewBlocks,
    });
    return (0, write_draft_util_1.toWriteDraftPublic)(draft);
}
exports.extractWriteDraftPublicFromApprovalRow = extractWriteDraftPublicFromApprovalRow;
function buildApprovalWriteDraftPayload(row, writeTool) {
    var _a;
    const snapshot = row.resumeSnapshot;
    const previewBlocks = Array.isArray(row.previewBlocks)
        ? row.previewBlocks
        : null;
    const draft = (0, write_draft_util_1.resolveWriteDraftFromApprovalSnapshot)(snapshot, {
        summary: (_a = row.summary) !== null && _a !== void 0 ? _a : null,
        previewBlocks,
    });
    const writeDraft = (0, write_draft_util_1.toWriteDraftPublic)(draft);
    const editPolicy = (0, resolve_write_draft_edit_policy_util_1.resolveWriteDraftEditPolicyForToolCall)({
        writeTool: writeTool !== null && writeTool !== void 0 ? writeTool : null,
        arguments: draft.arguments,
    });
    return { writeDraft, editPolicy };
}
exports.buildApprovalWriteDraftPayload = buildApprovalWriteDraftPayload;
//# sourceMappingURL=approval-write-draft.mapper.js.map