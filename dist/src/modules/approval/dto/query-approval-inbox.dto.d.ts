import { APPROVAL_INBOX_STATUS_FILTERS, type ApprovalInboxStatusFilter } from '../../../core/approval/approval-inbox-status.util';
export { APPROVAL_INBOX_STATUS_FILTERS, type ApprovalInboxStatusFilter };
export declare class QueryApprovalInboxDto {
    status?: ApprovalInboxStatusFilter;
    limit?: number;
    offset?: number;
}
