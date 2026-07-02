import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApprovalResumeService } from './approval-resume.service';
import { resumePageActionFromApprovalSnapshot } from './page-action-approval-resume.util';
import type { ApprovalRequestService } from './approval-request.service';
import type { ApprovalGateService } from './approval-gate.service';
import type { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
import type { PrismaService } from '../../prisma/prisma.service';

jest.mock('../page-action/page-workflow-orchestrator', () => ({
  orchestratePageWorkflow: jest.fn().mockResolvedValue({
    workflowRun: { status: 'completed' },
    suspended: false,
  }),
}));

jest.mock('./page-action-approval-resume.util', () => ({
  resumePageActionFromApprovalSnapshot: jest.fn().mockResolvedValue(undefined),
}));

describe('ApprovalResumeService', () => {
  let service: ApprovalResumeService;
  let approvalRequests: {
    markApproved: jest.Mock;
    markRejected: jest.Mock;
    markCancelled: jest.Mock;
    parseResumeSnapshot: jest.Mock;
  };
  let triggerPermission: {
    evaluateForNodes: jest.Mock;
    resolveUserAllowedToolIdsForApp: jest.Mock;
  };
  let prisma: {
    approvalRequest: { findUnique: jest.Mock };
    pageActionRun: { findUnique: jest.Mock; update: jest.Mock };
  };

  const pageActionSnapshot = {
    version: 1 as const,
    workflowRun: {
      workflowId: 1,
      version: 1,
      status: 'running' as const,
      currentNodeId: 'await',
      compiledFrom: 'workflow_db' as const,
      nodes: [],
    },
    workflowNodeDefs: [
      {
        id: 'write',
        action: 'write_data' as const,
        name: 'Write',
        objective: '',
        input: { toolId: 10 },
      },
    ],
    workflowNodeOutputs: {},
    pendingWrite: { name: 'tool', arguments: {}, riskLevel: 'L2' as const },
    scopedToolIds: [10],
    channel: { kind: 'page_action' as const, pageActionRunId: 88 },
  };

  beforeEach(() => {
    approvalRequests = {
      markApproved: jest.fn(),
      markRejected: jest.fn(),
      markCancelled: jest.fn(),
      parseResumeSnapshot: jest.fn(),
    };
    triggerPermission = {
      evaluateForNodes: jest.fn().mockReturnValue({ allowed: true, skipped: false }),
      resolveUserAllowedToolIdsForApp: jest.fn().mockResolvedValue([10]),
    };
    prisma = {
      approvalRequest: { findUnique: jest.fn() },
      pageActionRun: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    service = new ApprovalResumeService(
      prisma as unknown as PrismaService,
      approvalRequests as unknown as ApprovalRequestService,
      {} as ApprovalGateService,
      triggerPermission as unknown as ApprovalTriggerPermissionService,
      {} as never,
      {} as never,
    );
  });

  it('confirm returns resumed false when already decided', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      source: 'page_action',
    });
    approvalRequests.markApproved.mockResolvedValue({
      ok: false,
      reason: 'already_decided',
    });

    const result = await service.confirm({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(result).toEqual({ resumed: false });
  });

  it('confirm chat is rejected before CAS', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      source: 'chat',
    });

    await expect(
      service.confirm({ approvalRequestId: 1, decidedByUserId: 7 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(approvalRequests.markApproved).not.toHaveBeenCalled();
  });

  it('confirm page_action resumes after permission check', async () => {
    approvalRequests.markApproved.mockResolvedValue({ ok: true });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      appClientId: 1,
      source: 'page_action',
      sessionId: null,
      resumeSnapshot: pageActionSnapshot,
    });
    approvalRequests.parseResumeSnapshot.mockReturnValue(pageActionSnapshot);

    const result = await service.confirm({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(result).toEqual({ resumed: true });
    expect(triggerPermission.resolveUserAllowedToolIdsForApp).toHaveBeenCalled();
    expect(resumePageActionFromApprovalSnapshot).toHaveBeenCalled();
  });

  it('confirm cancels when approver lost write permission', async () => {
    approvalRequests.markApproved.mockResolvedValue({ ok: true });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      appClientId: 1,
      source: 'page_action',
      sessionId: null,
      resumeSnapshot: pageActionSnapshot,
    });
    approvalRequests.parseResumeSnapshot.mockReturnValue(pageActionSnapshot);
    triggerPermission.evaluateForNodes.mockReturnValue({
      allowed: false,
      missingToolIds: [10],
      skipped: false,
    });

    await expect(
      service.confirm({ approvalRequestId: 1, decidedByUserId: 7 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(approvalRequests.markCancelled).toHaveBeenCalled();
  });

  it('reject chat is rejected before CAS', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      source: 'chat',
      pageActionRunId: null,
    });

    await expect(
      service.reject({ approvalRequestId: 1, decidedByUserId: 7 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(approvalRequests.markRejected).not.toHaveBeenCalled();
  });

  it('reject page_action cancels run with audit step', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      source: 'page_action',
      pageActionRunId: 88,
      resumeSnapshot: pageActionSnapshot,
    });
    approvalRequests.markRejected.mockResolvedValue({ ok: true });
    approvalRequests.parseResumeSnapshot.mockReturnValue(pageActionSnapshot);
    prisma.pageActionRun.findUnique.mockResolvedValue({ steps: [] });

    await service.reject({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(prisma.pageActionRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 88 },
        data: expect.objectContaining({
          status: 'cancelled',
        }),
      }),
    );
  });
});
