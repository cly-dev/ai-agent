import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PrismaService } from '../../prisma/prisma.service';
export type ChatApprovalResumeChannel = 'session_confirm' | 'inbox_confirm';
export type ChatApprovalRejectChannel = 'session_cancel' | 'inbox_reject';
export type ChatApprovalAwaitingGateOutput = Record<string, unknown> & {
    status: 'awaiting_user';
    auditPhase: 'awaiting_approval';
    approvalRequestId: number;
    nodeId: string;
};
export type ChatApprovalConfirmedGateOutput = Record<string, unknown> & {
    status: 'approved';
    auditPhase: 'approval_confirmed';
    approvalRequestId: number;
    primaryRunId: number;
    resumeChannel: ChatApprovalResumeChannel;
    decidedByUserId: number;
    nodeId?: string | null;
};
export type ChatApprovalRejectedGateOutput = Record<string, unknown> & {
    status: 'rejected';
    auditPhase: 'approval_rejected';
    approvalRequestId: number;
    primaryRunId: number;
    rejectChannel: ChatApprovalRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
};
export type ChatApprovalResumeAudit = {
    approvalRequestId: number;
    resumeChannel: ChatApprovalResumeChannel;
    decidedByUserId: number;
    nodeId?: string | null;
};
export declare function offsetRunSteps(steps: AgentRunStep[], startStep: number): AgentRunStep[];
export declare function resolveChatApprovalResumeAudit(input: {
    approvalRequests: {
        findChatBySessionPrimaryRun(input: {
            appClientId: number;
            sessionId: string;
            runId: number;
        }): Promise<{
            id: number;
            nodeId: string;
        } | null>;
    };
    appClientId: number;
    sessionId: string;
    primaryRunId: number;
    decidedByUserId: number;
    resumeChannel: ChatApprovalResumeChannel;
    approvalRequestId?: number;
    nodeId?: string | null;
}): Promise<ChatApprovalResumeAudit | null>;
export declare function enrichChatApprovalAwaitingGateOutput(output: Record<string, unknown>, input: {
    approvalRequestId: number;
    nodeId: string;
}): ChatApprovalAwaitingGateOutput;
export declare function buildChatApprovalConfirmedRunStep(stepNumber: number, input: {
    approvalRequestId: number;
    primaryRunId: number;
    resumeChannel: ChatApprovalResumeChannel;
    decidedByUserId: number;
    nodeId?: string | null;
}): AgentRunStep;
export declare function buildChatApprovalRejectedRunStep(stepNumber: number, input: {
    approvalRequestId: number;
    primaryRunId: number;
    rejectChannel: ChatApprovalRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
}): AgentRunStep;
export declare function appendChatApprovalRejectedAuditToPrimaryRun(input: {
    prisma: PrismaService;
    primaryRunId: number;
    approvalRequestId: number;
    rejectChannel: ChatApprovalRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
}): Promise<void>;
