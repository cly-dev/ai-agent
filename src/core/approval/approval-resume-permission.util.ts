import type { ApprovalSource } from '../../../generated/prisma/client';
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
  if (input.source === 'page_action' || input.source === 'webhook') {
    return input.triggerPermission.resolveUserAllowedToolIdsForApp({
      userId: input.approverUserId,
      appClientId: input.appClientId,
    });
  }
  const sessionId =
    input.snapshot.channel.kind === 'chat'
      ? input.snapshot.channel.sessionId
      : input.sessionId;
  if (!sessionId) {
    return input.snapshot.scopedToolIds;
  }
  const session = await input.prisma.session.findFirst({
    where: { id: sessionId, userId: input.approverUserId },
    select: { agentId: true },
  });
  if (!session?.agentId) {
    return [];
  }
  return input.triggerPermission.resolveUserAllowedToolIds({
    userId: input.approverUserId,
    appClientId: input.appClientId,
    agentId: session.agentId,
  });
}
