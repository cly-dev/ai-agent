import { ApprovalStatus, type ApprovalRequest, type Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalCasResult, ApprovalDecisionInput, CreateApprovalRequestInput } from './approval.types';
export declare const APPROVAL_INBOX_SOURCES: readonly ["page_action", "webhook"];
declare const APPROVAL_INBOX_INCLUDE: {
    workflow: {
        select: {
            workflowKey: true;
            name: true;
        };
    };
    initiator: {
        select: {
            id: true;
            username: true;
            employeeId: true;
        };
    };
};
export type ApprovalInboxRow = Prisma.ApprovalRequestGetPayload<{
    include: typeof APPROVAL_INBOX_INCLUDE;
}>;
export declare class ApprovalRequestService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPending(input: CreateApprovalRequestInput): Promise<ApprovalRequest>;
    findPendingByIdempotencyKey(input: {
        appClientId: number;
        idempotencyKey: string;
    }): Promise<ApprovalRequest | null>;
    findByIdForApprover(approvalRequestId: number, approverUserId: number): Promise<ApprovalRequest | null>;
    listPendingForApprover(input: {
        appClientId: number;
        approverUserId: number;
        limit?: number;
        offset?: number;
    }): Promise<ApprovalInboxRow[]>;
    parseResumeSnapshot(row: ApprovalRequest): ApprovalResumeSnapshot;
    casDecide(approvalRequestId: number, nextStatus: Extract<ApprovalStatus, 'approved' | 'rejected' | 'cancelled'>, input: ApprovalDecisionInput): Promise<ApprovalCasResult>;
    markApproved(input: ApprovalDecisionInput): Promise<ApprovalCasResult>;
    markRejected(input: ApprovalDecisionInput): Promise<ApprovalCasResult>;
    markCancelled(input: ApprovalDecisionInput): Promise<ApprovalCasResult>;
    updatePendingSnapshot(input: {
        approvalRequestId: number;
        approverUserId: number;
        resumeSnapshot: ApprovalResumeSnapshot;
        previewBlocks?: unknown;
        summary?: string | null;
    }): Promise<boolean>;
    reserveDraftRetrySlot(input: {
        approvalRequestId: number;
        approverUserId: number;
    }): Promise<{
        ok: true;
        draftRetryCount: number;
    } | {
        ok: false;
        reason: 'not_found' | 'not_pending' | 'limit_exceeded';
    }>;
}
export {};
