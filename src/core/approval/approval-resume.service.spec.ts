import { NotFoundException } from '@nestjs/common';
import { ApprovalStatus } from '../../../generated/prisma/client';
import { ApprovalResumeService } from './approval-resume.service';
import type { ApprovalRequestService } from './approval-request.service';
import type { ApprovalGateService } from './approval-gate.service';
import type { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
import type { PrismaService } from '../../prisma/prisma.service';
import type { PendingWriteConfirmationStore } from '../../modules/chat/pending-write-confirmation.store';
import type { SessionRunCoordinator } from '../session-run/session-run-coordinator.service';
import type { AgentRunSseGateway } from '../session-run/agent-run-sse.gateway';

jest.mock('../page-action/page-workflow-orchestrator', () => ({
  orchestratePageWorkflow: jest.fn().mockResolvedValue({
    workflowRun: { status: 'completed' },
    suspended: false,
  }),
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
    resolveUserAllowedToolIds: jest.Mock;
  };
  let prisma: {
    approvalRequest: { findUnique: jest.Mock };
    session: { findFirst: jest.Mock };
    pageActionRun: { findUnique: jest.Mock; update: jest.Mock };
    agentRun: { findFirst: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let pendingStore: { get: jest.Mock; clear: jest.Mock; set: jest.Mock };
  let sessionRunCoordinator: {
    enqueueApprovalInboxResumeFromSnapshot: jest.Mock;
  };
  let runSse: { purgeWriteConfirmationGate: jest.Mock; emitWriteConfirmationCancelled: jest.Mock };

  const chatSnapshot = {
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
    channel: {
      kind: 'chat' as const,
      sessionId: 'sess_1',
      runId: 101,
      turnId: 55,
      resume: { steps: [], iteration: 0, toolObservations: [], scopedToolIds: [10], intentKind: 'task' as const, hasExpandedOnce: false },
    },
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
      resolveUserAllowedToolIds: jest.fn().mockResolvedValue([10]),
    };
    prisma = {
      approvalRequest: { findUnique: jest.fn() },
      session: { findFirst: jest.fn().mockResolvedValue({ agentId: 2 }) },
      pageActionRun: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      agentRun: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    pendingStore = {
      get: jest.fn(),
      clear: jest.fn(),
      set: jest.fn(),
    };
    sessionRunCoordinator = {
      enqueueApprovalInboxResumeFromSnapshot: jest
        .fn()
        .mockResolvedValue(1),
    };
    runSse = {
      purgeWriteConfirmationGate: jest.fn(),
      emitWriteConfirmationCancelled: jest.fn(),
    };

    service = new ApprovalResumeService(
      prisma as unknown as PrismaService,
      approvalRequests as unknown as ApprovalRequestService,
      {} as ApprovalGateService,
      triggerPermission as unknown as ApprovalTriggerPermissionService,
      {} as never,
      {} as never,
      pendingStore as unknown as PendingWriteConfirmationStore,
      runSse as unknown as AgentRunSseGateway,
      sessionRunCoordinator as unknown as SessionRunCoordinator,
    );
  });

  it('confirm returns resumed false when already decided', async () => {
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

  it('confirm chat triggers snapshot-based inbox resume', async () => {
    approvalRequests.markApproved.mockResolvedValue({ ok: true });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      appClientId: 1,
      source: 'chat',
      sessionId: 'sess_1',
      resumeSnapshot: chatSnapshot,
    });
    approvalRequests.parseResumeSnapshot.mockReturnValue(chatSnapshot);

    const result = await service.confirm({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(result).toEqual({ resumed: true });
    expect(triggerPermission.resolveUserAllowedToolIds).toHaveBeenCalled();
    expect(
      sessionRunCoordinator.enqueueApprovalInboxResumeFromSnapshot,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'sess_1',
        userId: 7,
        snapshot: chatSnapshot,
        approvalRequestId: 1,
      }),
    );
  });

  it('confirm chat resumes from snapshot without redis gate', async () => {
    approvalRequests.markApproved.mockResolvedValue({ ok: true });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      appClientId: 1,
      source: 'chat',
      sessionId: 'sess_1',
      resumeSnapshot: chatSnapshot,
    });
    approvalRequests.parseResumeSnapshot.mockReturnValue(chatSnapshot);
    pendingStore.get.mockResolvedValue(null);

    await service.confirm({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(pendingStore.set).not.toHaveBeenCalled();
    expect(
      sessionRunCoordinator.enqueueApprovalInboxResumeFromSnapshot,
    ).toHaveBeenCalled();
  });

  it('confirm cancels when approver lost write permission', async () => {
    approvalRequests.markApproved.mockResolvedValue({ ok: true });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      appClientId: 1,
      source: 'page_action',
      sessionId: null,
      resumeSnapshot: chatSnapshot,
    });
    approvalRequests.parseResumeSnapshot.mockReturnValue(chatSnapshot);
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

  it('reject chat clears redis gate and emits cancellation', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      pageActionRunId: null,
      resumeSnapshot: chatSnapshot,
    });
    approvalRequests.markRejected.mockResolvedValue({ ok: true });
    approvalRequests.parseResumeSnapshot.mockReturnValue(chatSnapshot);
    prisma.agentRun.findUnique.mockResolvedValue({ steps: [] });
    prisma.agentRun.update.mockResolvedValue({});
    pendingStore.get.mockResolvedValue({
      runId: 101,
      sessionId: 'sess_1',
      turnId: 55,
    });

    await service.reject({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(pendingStore.clear).toHaveBeenCalledWith('sess_1');
    expect(runSse.purgeWriteConfirmationGate).toHaveBeenCalledWith('sess_1', 101);
    expect(runSse.emitWriteConfirmationCancelled).toHaveBeenCalled();
  });

  it('reject page_action cancels run with audit step', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      id: 1,
      approverUserId: 7,
      pageActionRunId: 88,
      resumeSnapshot: {
        ...chatSnapshot,
        channel: { kind: 'page_action', pageActionRunId: 88 },
      },
    });
    approvalRequests.markRejected.mockResolvedValue({ ok: true });
    approvalRequests.parseResumeSnapshot.mockReturnValue({
      ...chatSnapshot,
      channel: { kind: 'page_action', pageActionRunId: 88 },
    });
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
