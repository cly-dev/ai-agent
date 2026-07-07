import { ApprovalStatus } from '../../../generated/prisma/client';
export declare const APPROVAL_INBOX_STATUS_FILTERS: readonly ["pending", "approved", "rejected", "cancelled", "expired", "decided", "all"];
export type ApprovalInboxStatusFilter = (typeof APPROVAL_INBOX_STATUS_FILTERS)[number];
export declare function resolveApprovalInboxStatuses(filter: ApprovalInboxStatusFilter | undefined): ApprovalStatus[] | undefined;
