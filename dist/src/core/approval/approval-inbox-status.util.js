"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveApprovalInboxStatuses = exports.APPROVAL_INBOX_STATUS_FILTERS = void 0;
const client_1 = require("../../../generated/prisma/client");
exports.APPROVAL_INBOX_STATUS_FILTERS = [
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'expired',
    'decided',
    'all',
];
const DECIDED_STATUSES = [
    client_1.ApprovalStatus.approved,
    client_1.ApprovalStatus.rejected,
    client_1.ApprovalStatus.cancelled,
];
function resolveApprovalInboxStatuses(filter) {
    switch (filter !== null && filter !== void 0 ? filter : 'pending') {
        case 'pending':
            return [client_1.ApprovalStatus.pending];
        case 'approved':
            return [client_1.ApprovalStatus.approved];
        case 'rejected':
            return [client_1.ApprovalStatus.rejected];
        case 'cancelled':
            return [client_1.ApprovalStatus.cancelled];
        case 'expired':
            return [client_1.ApprovalStatus.expired];
        case 'decided':
            return [...DECIDED_STATUSES];
        case 'all':
            return undefined;
        default:
            return [client_1.ApprovalStatus.pending];
    }
}
exports.resolveApprovalInboxStatuses = resolveApprovalInboxStatuses;
//# sourceMappingURL=approval-inbox-status.util.js.map