import type { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalGateService } from './approval-gate.service';
import type { LlmService } from '../llm/llm.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { DraftReviewDecision } from '../draft-review';
export declare function resumePageActionFromApprovalSnapshot(input: {
    snapshot: ApprovalResumeSnapshot;
    approvalRequestId: number;
    decision?: DraftReviewDecision | null;
    prisma: PrismaService;
    llmService: LlmService;
    toolEngine: ToolEngineService;
    approvalGate: ApprovalGateService;
}): Promise<void>;
export declare function retryPageActionFromApprovalSnapshot(input: {
    snapshot: ApprovalResumeSnapshot;
    approvalRequestId: number;
    retryInstruction: string;
    prisma: PrismaService;
    llmService: LlmService;
    toolEngine: ToolEngineService;
    approvalGate: ApprovalGateService;
}): Promise<boolean>;
