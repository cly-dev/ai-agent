import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalGateService } from './approval-gate.service';
import { ApprovalRequestService } from './approval-request.service';
import { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
import type { ApprovalDecisionInput } from './approval.types';
import { SessionRunCoordinator } from '../session-run/session-run-coordinator.service';
import { AgentRunSseGateway } from '../session-run/agent-run-sse.gateway';
import { PendingWriteConfirmationStore } from '../../modules/chat/pending-write-confirmation.store';
import { LlmService } from '../llm/llm.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
export declare class ApprovalResumeService {
    private readonly prisma;
    private readonly approvalRequests;
    private readonly approvalGate;
    private readonly triggerPermission;
    private readonly llmService;
    private readonly toolEngine;
    private readonly pendingWriteConfirmationStore;
    private readonly runSse;
    private readonly sessionRunCoordinator;
    private readonly logger;
    constructor(prisma: PrismaService, approvalRequests: ApprovalRequestService, approvalGate: ApprovalGateService, triggerPermission: ApprovalTriggerPermissionService, llmService: LlmService, toolEngine: ToolEngineService, pendingWriteConfirmationStore: PendingWriteConfirmationStore, runSse: AgentRunSseGateway, sessionRunCoordinator: SessionRunCoordinator);
    confirm(input: ApprovalDecisionInput): Promise<{
        resumed: boolean;
    }>;
    reject(input: ApprovalDecisionInput): Promise<void>;
    private assertResumePermission;
    private resumeChatFromInboxConfirm;
    private rejectChatFromInbox;
}
