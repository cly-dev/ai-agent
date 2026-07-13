import { ApprovalGateService } from '../../approval/approval-gate.service';
import { ApprovalTriggerPermissionService } from '../../approval/approval-trigger-permission.service';
import { ToolEngineService } from '../../tool-engine/tool-engine.service';
import { LlmService } from '../../llm/llm.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PageActionRunStreamHub } from '../stream/page-action-run-stream.hub';
import type { PageActionRunExecutionInput } from './page-action-invoke.types';
export declare class PageActionRunExecutor {
    private readonly prisma;
    private readonly llmService;
    private readonly toolEngine;
    private readonly approvalGate;
    private readonly triggerPermission;
    private readonly runStreamHub;
    private readonly logger;
    constructor(prisma: PrismaService, llmService: LlmService, toolEngine: ToolEngineService, approvalGate: ApprovalGateService, triggerPermission: ApprovalTriggerPermissionService, runStreamHub: PageActionRunStreamHub);
    executeInBackground(input: PageActionRunExecutionInput): void;
    execute(input: PageActionRunExecutionInput): Promise<void>;
    private executeWorkflow;
}
