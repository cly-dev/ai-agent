import { ApprovalStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApprovalRequestService } from './approval-request.service';

describe('ApprovalRequestService', () => {
  let service: ApprovalRequestService;
  let prisma: {
    approvalRequest: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      approvalRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    service = new ApprovalRequestService(prisma as unknown as PrismaService);
  });

  it('casDecide approves pending request once', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      status: ApprovalStatus.pending,
      approverUserId: 7,
    });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.markApproved({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(result).toEqual({ ok: true, previousStatus: ApprovalStatus.pending });
    expect(prisma.approvalRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 1,
          status: ApprovalStatus.pending,
          approverUserId: 7,
        },
        data: expect.objectContaining({
          status: ApprovalStatus.approved,
          decidedByUserId: 7,
        }),
      }),
    );
  });

  it('casDecide returns already_decided for non-pending', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      status: ApprovalStatus.approved,
      approverUserId: 7,
    });

    const result = await service.markApproved({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(result).toEqual({ ok: false, reason: 'already_decided' });
    expect(prisma.approvalRequest.updateMany).not.toHaveBeenCalled();
  });

  it('casDecide hides wrong approver as not_found', async () => {
    prisma.approvalRequest.findUnique.mockResolvedValue({
      status: ApprovalStatus.pending,
      approverUserId: 99,
    });

    const result = await service.markRejected({
      approvalRequestId: 1,
      decidedByUserId: 7,
    });

    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('syncChatRealtimeDecision marks approved by session run', async () => {
    prisma.approvalRequest.findFirst.mockResolvedValue({ id: 12, approverUserId: 7 });
    prisma.approvalRequest.findUnique.mockResolvedValue({
      status: ApprovalStatus.pending,
      approverUserId: 7,
    });
    prisma.approvalRequest.updateMany.mockResolvedValue({ count: 1 });

    await service.syncChatRealtimeDecision({
      appClientId: 1,
      sessionId: 'sess_a',
      runId: 101,
      decidedByUserId: 7,
      decision: 'approved',
    });

    expect(prisma.approvalRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sessionId: 'sess_a',
          source: 'chat',
          status: ApprovalStatus.pending,
        }),
      }),
    );
    expect(prisma.approvalRequest.updateMany).toHaveBeenCalled();
  });
});
