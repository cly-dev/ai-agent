import { ApprovalSource } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
export declare function resolveApproverAllowedToolIds(input: {
    approverUserId: number;
    appClientId: number;
    source: ApprovalSource;
    snapshot: ApprovalResumeSnapshot;
    sessionId: string | null;
    prisma: PrismaService;
    triggerPermission: ApprovalTriggerPermissionService;
}): Promise<number[]>;
