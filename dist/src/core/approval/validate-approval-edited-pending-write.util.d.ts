import type { DraftReviewDecision } from '../draft-review';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { PrismaService } from '../../prisma/prisma.service';
export declare function resolveApprovalSnapshotForDecision(input: {
    snapshot: ApprovalResumeSnapshot;
    decision: DraftReviewDecision | null;
    userId: number;
    prisma: PrismaService;
    toolEngine: ToolEngineService;
}): Promise<ApprovalResumeSnapshot>;
