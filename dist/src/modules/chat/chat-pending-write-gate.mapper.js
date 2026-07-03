"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPendingWriteGatePublicState = void 0;
const draft_review_1 = require("../../core/draft-review");
function buildPendingWriteGatePublicState(pending) {
    var _a;
    const draftRetryCount = (_a = pending.resumeContext.draftRetryCount) !== null && _a !== void 0 ? _a : 0;
    const budget = (0, draft_review_1.resolveDraftRetryBudget)(draftRetryCount);
    const publicList = (0, draft_review_1.buildWriteDraftPublicListFromChatGate)({
        toolCalls: pending.toolCalls,
        writeDraft: pending.writeDraft,
        writeDrafts: pending.writeDrafts,
        observations: pending.resumeContext.toolObservations,
        confirmedPreviewSerialized: pending.resumeContext.confirmedPreviewSerialized,
        draftRetryCount,
    });
    return Object.assign(Object.assign({ runId: pending.runId, turnId: pending.turnId, draftRetryCount: budget.used, draftRetryMax: budget.max, canRetry: budget.canRetry }, (publicList[0] ? { writeDraft: publicList[0] } : {})), (publicList.length > 1 ? { writeDrafts: publicList } : {}));
}
exports.buildPendingWriteGatePublicState = buildPendingWriteGatePublicState;
//# sourceMappingURL=chat-pending-write-gate.mapper.js.map