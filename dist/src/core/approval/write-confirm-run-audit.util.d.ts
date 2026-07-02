import type { AgentRunStep } from '../agent-engine/engine/main/types/agent-engine.types';
import type { PrismaService } from '../../prisma/prisma.service';
export type ChatWriteConfirmRejectChannel = 'session_cancel';
export type ChatWriteConfirmResumeAudit = {
    decidedByUserId: number;
    nodeId?: string | null;
};
export declare function buildChatWriteConfirmConfirmedRunStep(stepNumber: number, input: {
    primaryRunId: number;
    decidedByUserId: number;
    nodeId?: string | null;
}): AgentRunStep;
export declare function buildChatWriteConfirmRejectedRunStep(stepNumber: number, input: {
    primaryRunId: number;
    rejectChannel: ChatWriteConfirmRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
}): AgentRunStep;
export declare function appendChatWriteConfirmRejectedAuditToPrimaryRun(input: {
    prisma: PrismaService;
    primaryRunId: number;
    rejectChannel: ChatWriteConfirmRejectChannel;
    decidedByUserId: number;
    decisionNote?: string | null;
}): Promise<void>;
