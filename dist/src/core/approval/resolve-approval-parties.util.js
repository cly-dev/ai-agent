"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApprovalParties = exports.parseApprovalTriggerBinding = void 0;
function isPositiveUserId(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function parseApprovalTriggerBinding(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return null;
    }
    const raw = config.approverUserId;
    if (raw === undefined || raw === null) {
        return null;
    }
    if (!isPositiveUserId(raw)) {
        return null;
    }
    return { approverUserId: raw };
}
exports.parseApprovalTriggerBinding = parseApprovalTriggerBinding;
function resolveApprovalParties(input) {
    var _a;
    if (input.source === 'webhook') {
        if (!isPositiveUserId(input.webhookApproverUserId)) {
            return { ok: false, code: 'missing_webhook_approver' };
        }
        return {
            ok: true,
            parties: {
                initiatorUserId: null,
                approverUserId: input.webhookApproverUserId,
            },
        };
    }
    if (!isPositiveUserId(input.initiatorUserId)) {
        return { ok: false, code: 'missing_initiator' };
    }
    const override = (_a = input.triggerBinding) === null || _a === void 0 ? void 0 : _a.approverUserId;
    if (override != null && !isPositiveUserId(override)) {
        return { ok: false, code: 'invalid_approver_override' };
    }
    return {
        ok: true,
        parties: {
            initiatorUserId: input.initiatorUserId,
            approverUserId: override !== null && override !== void 0 ? override : input.initiatorUserId,
        },
    };
}
exports.resolveApprovalParties = resolveApprovalParties;
//# sourceMappingURL=resolve-approval-parties.util.js.map