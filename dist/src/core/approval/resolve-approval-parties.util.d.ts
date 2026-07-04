import type { ApprovalSource } from '../../../generated/prisma/client';
export type ApprovalTriggerBinding = {
    approverUserId?: number | null;
};
export type ResolveApprovalPartiesInput = {
    source: ApprovalSource;
    initiatorUserId: number | null;
    triggerBinding?: ApprovalTriggerBinding | null;
    webhookApproverUserId?: number | null;
};
export type ResolvedApprovalParties = {
    initiatorUserId: number | null;
    approverUserId: number;
};
export type ResolveApprovalPartiesError = 'missing_initiator' | 'missing_webhook_approver' | 'invalid_approver_override';
export type ResolveApprovalPartiesResult = {
    ok: true;
    parties: ResolvedApprovalParties;
} | {
    ok: false;
    code: ResolveApprovalPartiesError;
};
export declare function parseApprovalTriggerBinding(config: unknown): ApprovalTriggerBinding | null;
export declare function resolveApprovalParties(input: ResolveApprovalPartiesInput): ResolveApprovalPartiesResult;
