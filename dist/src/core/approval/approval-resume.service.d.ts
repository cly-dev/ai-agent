import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalGateService } from './approval-gate.service';
import { ApprovalRequestService } from './approval-request.service';
import { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
import type { ApprovalDecisionInput } from './approval.types';
import { LlmService } from '../llm/llm.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';
import { PageActionRunStreamHub } from '../page-action/stream/page-action-run-stream.hub';
export declare class ApprovalResumeService {
    private readonly prisma;
    private readonly approvalRequests;
    private readonly approvalGate;
    private readonly triggerPermission;
    private readonly llmService;
    private readonly toolEngine;
    private readonly runStreamHub;
    constructor(prisma: PrismaService, approvalRequests: ApprovalRequestService, approvalGate: ApprovalGateService, triggerPermission: ApprovalTriggerPermissionService, llmService: LlmService, toolEngine: ToolEngineService, runStreamHub: PageActionRunStreamHub);
    decide(input: ApprovalDecisionInput): Promise<{
        resumed: boolean;
        suspended?: boolean;
    }>;
    confirm(input: ApprovalDecisionInput): Promise<{
        resumed: boolean;
    }>;
    reject(input: ApprovalDecisionInput): Promise<void>;
    private retryPageAction;
    private assertResumePermission;
}
