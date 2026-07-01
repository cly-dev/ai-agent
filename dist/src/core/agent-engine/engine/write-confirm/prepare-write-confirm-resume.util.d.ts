import type { PendingWriteConfirmationStore } from '../../../../modules/chat/pending-write-confirmation.store';
import type { ApprovalRequestService } from '../../../approval/approval-request.service';
import type { ApprovalResumeSnapshot } from '../../../approval/approval-resume-snapshot.types';
import type { AgentRunSseGateway } from '../../../session-run/agent-run-sse.gateway';
import type { AgentService } from '../../../../modules/agent/agent.service';
import type { PrismaService } from '../../../../prisma/prisma.service';
import type { ResumeAfterWriteConfirmInput } from '../main/types/agent-engine.types';
import type { WriteConfirmResumePrepared } from './write-confirm-resume.types';
export type PrepareWriteConfirmFromRedisInput = {
    resumeInput: ResumeAfterWriteConfirmInput;
    prisma: PrismaService;
    agentService: AgentService;
    pendingWriteConfirmationStore: PendingWriteConfirmationStore;
    emitWriteConfirmationExpired(sessionId: string): void;
};
export declare function prepareWriteConfirmFromRedis(input: PrepareWriteConfirmFromRedisInput): Promise<WriteConfirmResumePrepared | null>;
export type PrepareWriteConfirmFromApprovalSnapshotInput = {
    resumeInput: ResumeAfterWriteConfirmInput;
    snapshot: ApprovalResumeSnapshot;
    prisma: PrismaService;
    agentService: AgentService;
};
export declare function prepareWriteConfirmFromApprovalSnapshot(input: PrepareWriteConfirmFromApprovalSnapshotInput): Promise<WriteConfirmResumePrepared | null>;
export type ReleaseWriteConfirmGateInput = {
    sessionId: string;
    userId: number;
    runId: number;
    appClientId: number;
    pendingWriteConfirmationStore: PendingWriteConfirmationStore;
    runSse: AgentRunSseGateway;
    approvalRequests: ApprovalRequestService;
    skipChatApprovalSync?: boolean;
};
export declare function releaseWriteConfirmGate(input: ReleaseWriteConfirmGateInput): Promise<void>;
