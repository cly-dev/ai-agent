import { ApprovalStatus } from '../../../generated/prisma/client';

export const APPROVAL_INBOX_STATUS_FILTERS = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
  'decided',
  'all',
] as const;

export type ApprovalInboxStatusFilter =
  (typeof APPROVAL_INBOX_STATUS_FILTERS)[number];

const DECIDED_STATUSES = [
  ApprovalStatus.approved,
  ApprovalStatus.rejected,
  ApprovalStatus.cancelled,
] as const;

export function resolveApprovalInboxStatuses(
  filter: ApprovalInboxStatusFilter | undefined,
): ApprovalStatus[] | undefined {
  switch (filter ?? 'pending') {
    case 'pending':
      return [ApprovalStatus.pending];
    case 'approved':
      return [ApprovalStatus.approved];
    case 'rejected':
      return [ApprovalStatus.rejected];
    case 'cancelled':
      return [ApprovalStatus.cancelled];
    case 'expired':
      return [ApprovalStatus.expired];
    case 'decided':
      return [...DECIDED_STATUSES];
    case 'all':
      return undefined;
    default:
      return [ApprovalStatus.pending];
  }
}
