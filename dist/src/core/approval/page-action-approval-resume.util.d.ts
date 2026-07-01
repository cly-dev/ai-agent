import type { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalGateService } from './approval-gate.service';
import type { LlmService } from '../llm/llm.service';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
export declare function resumePageActionFromApprovalSnapshot(input: {
    snapshot: ApprovalResumeSnapshot;
    approvalRequestId: number;
    prisma: PrismaService;
    llmService: LlmService;
    toolEngine: ToolEngineService;
    approvalGate: ApprovalGateService;
}): Promise<void>;
