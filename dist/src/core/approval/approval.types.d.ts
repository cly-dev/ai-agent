import type { ApprovalSource, ApprovalStatus } from '../../../generated/prisma/client';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
export type CreateApprovalRequestInput = {
    appClientId: number;
    source: ApprovalSource;
    initiatorUserId: number | null;
    approverUserId: number;
    workflowId: number;
    workflowVersion: number;
    nodeId: string;
    title: string;
    summary?: string | null;
    previewBlocks?: unknown;
    resumeSnapshot: ApprovalResumeSnapshot;
    pageActionRunId?: number | null;
    sessionId?: string | null;
    idempotencyKey?: string | null;
};
export type ApprovalDecisionInput = {
    approvalRequestId: number;
    decidedByUserId: number;
    decisionNote?: string | null;
};
export type ApprovalCasResult = {
    ok: true;
    previousStatus: ApprovalStatus;
} | {
    ok: false;
    reason: 'not_found' | 'not_pending' | 'already_decided';
};
