"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteGateDecisionRejectedError = void 0;
class WriteGateDecisionRejectedError extends Error {
    constructor(message, code = 'INVALID_DRAFT_REVIEW_DECISION') {
        super(message);
        this.name = 'WriteGateDecisionRejectedError';
        this.code = code;
    }
}
exports.WriteGateDecisionRejectedError = WriteGateDecisionRejectedError;
//# sourceMappingURL=write-gate-decision.error.js.map