"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractWriteDraftPublicFromApprovalRow = void 0;
const write_draft_util_1 = require("../../core/draft-review/write-draft.util");
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
//# sourceMappingURL=approval-write-draft.mapper.js.map