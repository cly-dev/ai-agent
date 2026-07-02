import { ApprovalSource } from '../../../generated/prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';

export async function resolveApproverAllowedToolIds(input: {
  approverUserId: number;
  appClientId: number;
  source: ApprovalSource;
  snapshot: ApprovalResumeSnapshot;
  sessionId: string | null;
  prisma: PrismaService;
  triggerPermission: ApprovalTriggerPermissionService;
}): Promise<number[]> {
  if (input.source === ApprovalSource.page_action || input.source === ApprovalSource.webhook) {
    return input.triggerPermission.resolveUserAllowedToolIdsForApp({
      userId: input.approverUserId,
      appClientId: input.appClientId,
    });
  }
  // Legacy chat rows: inbox confirm is blocked; fall back to snapshot tool scope.
  return input.snapshot.scopedToolIds;
}
