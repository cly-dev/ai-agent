import { ApprovalStatus, type ApprovalRequest, type Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalCasResult, ApprovalDecisionInput, CreateApprovalRequestInput } from './approval.types';
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
    findChatBySessionPrimaryRun(input: {
        appClientId: number;
        sessionId: string;
        runId: number;
    }): Promise<ApprovalRequest | null>;
    findPendingChatBySessionRun(input: {
        appClientId: number;
        sessionId: string;
        runId: number;
    }): Promise<ApprovalRequest | null>;
    syncChatRealtimeDecision(input: {
        appClientId: number;
        sessionId: string;
        runId: number;
        decidedByUserId: number;
        decision: 'approved' | 'rejected';
        decisionNote?: string | null;
    }): Promise<void>;
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
}
export {};
