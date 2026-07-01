import { Injectable } from '@nestjs/common';
import {
  ApprovalStatus,
  type ApprovalRequest,
  type Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type {
  ApprovalCasResult,
  ApprovalDecisionInput,
  CreateApprovalRequestInput,
} from './approval.types';

const APPROVAL_INBOX_INCLUDE = {
  workflow: { select: { workflowKey: true, name: true } },
  initiator: { select: { id: true, username: true, employeeId: true } },
} satisfies Prisma.ApprovalRequestInclude;

export type ApprovalInboxRow = Prisma.ApprovalRequestGetPayload<{
  include: typeof APPROVAL_INBOX_INCLUDE;
}>;

@Injectable()
export class ApprovalRequestService {
  constructor(private readonly prisma: PrismaService) {}

  async createPending(
    input: CreateApprovalRequestInput,
  ): Promise<ApprovalRequest> {
    return this.prisma.approvalRequest.create({
      data: {
        appClientId: input.appClientId,
        source: input.source,
        status: ApprovalStatus.pending,
        initiatorUserId: input.initiatorUserId,
        approverUserId: input.approverUserId,
        workflowId: input.workflowId,
        workflowVersion: input.workflowVersion,
        nodeId: input.nodeId,
        title: input.title,
        summary: input.summary ?? null,
        previewBlocks:
          input.previewBlocks === undefined
            ? undefined
            : (input.previewBlocks as Prisma.InputJsonValue),
        resumeSnapshot: input.resumeSnapshot as unknown as Prisma.InputJsonValue,
        pageActionRunId: input.pageActionRunId ?? null,
        sessionId: input.sessionId ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
      },
    });
  }

  async findPendingByIdempotencyKey(input: {
    appClientId: number;
    idempotencyKey: string;
  }): Promise<ApprovalRequest | null> {
    return this.prisma.approvalRequest.findFirst({
      where: {
        appClientId: input.appClientId,
        idempotencyKey: input.idempotencyKey,
        status: ApprovalStatus.pending,
      },
    });
  }

  async findChatBySessionPrimaryRun(input: {
    appClientId: number;
    sessionId: string;
    runId: number;
  }): Promise<ApprovalRequest | null> {
    return this.prisma.approvalRequest.findFirst({
      where: {
        appClientId: input.appClientId,
        sessionId: input.sessionId,
        source: 'chat',
        resumeSnapshot: {
          path: ['channel', 'runId'],
          equals: input.runId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingChatBySessionRun(input: {
    appClientId: number;
    sessionId: string;
    runId: number;
  }): Promise<ApprovalRequest | null> {
    return this.prisma.approvalRequest.findFirst({
      where: {
        appClientId: input.appClientId,
        sessionId: input.sessionId,
        source: 'chat',
        status: ApprovalStatus.pending,
        resumeSnapshot: {
          path: ['channel', 'runId'],
          equals: input.runId,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async syncChatRealtimeDecision(input: {
    appClientId: number;
    sessionId: string;
    runId: number;
    decidedByUserId: number;
    decision: 'approved' | 'rejected';
    decisionNote?: string | null;
  }): Promise<void> {
    const row = await this.findPendingChatBySessionRun({
      appClientId: input.appClientId,
      sessionId: input.sessionId,
      runId: input.runId,
    });
    if (!row) {
      return;
    }
    const payload = {
      approvalRequestId: row.id,
      decidedByUserId: input.decidedByUserId,
      decisionNote: input.decisionNote ?? null,
    };
    if (input.decision === 'approved') {
      await this.markApproved(payload);
      return;
    }
    await this.markRejected(payload);
  }

  async findByIdForApprover(
    approvalRequestId: number,
    approverUserId: number,
  ): Promise<ApprovalRequest | null> {
    return this.prisma.approvalRequest.findFirst({
      where: { id: approvalRequestId, approverUserId },
    });
  }

  async listPendingForApprover(input: {
    appClientId: number;
    approverUserId: number;
    limit?: number;
    offset?: number;
  }): Promise<ApprovalInboxRow[]> {
    return this.prisma.approvalRequest.findMany({
      where: {
        appClientId: input.appClientId,
        approverUserId: input.approverUserId,
        status: ApprovalStatus.pending,
      },
      orderBy: { createdAt: 'desc' },
      take: input.limit ?? 50,
      skip: input.offset ?? 0,
      include: APPROVAL_INBOX_INCLUDE,
    });
  }

  parseResumeSnapshot(row: ApprovalRequest): ApprovalResumeSnapshot {
    return row.resumeSnapshot as unknown as ApprovalResumeSnapshot;
  }

  async casDecide(
    approvalRequestId: number,
    nextStatus: Extract<
      ApprovalStatus,
      'approved' | 'rejected' | 'cancelled'
    >,
    input: ApprovalDecisionInput,
  ): Promise<ApprovalCasResult> {
    const existing = await this.prisma.approvalRequest.findUnique({
      where: { id: approvalRequestId },
      select: { status: true, approverUserId: true },
    });
    if (!existing) {
      return { ok: false, reason: 'not_found' };
    }
    if (existing.approverUserId !== input.decidedByUserId) {
      return { ok: false, reason: 'not_found' };
    }
    if (existing.status !== ApprovalStatus.pending) {
      return { ok: false, reason: 'already_decided' };
    }

    const updated = await this.prisma.approvalRequest.updateMany({
      where: {
        id: approvalRequestId,
        status: ApprovalStatus.pending,
        approverUserId: input.decidedByUserId,
      },
      data: {
        status: nextStatus,
        decidedByUserId: input.decidedByUserId,
        decidedAt: new Date(),
        decisionNote: input.decisionNote ?? null,
      },
    });
    if (updated.count === 0) {
      return { ok: false, reason: 'not_pending' };
    }
    return { ok: true, previousStatus: ApprovalStatus.pending };
  }

  async markApproved(input: ApprovalDecisionInput): Promise<ApprovalCasResult> {
    return this.casDecide(input.approvalRequestId, ApprovalStatus.approved, input);
  }

  async markRejected(input: ApprovalDecisionInput): Promise<ApprovalCasResult> {
    return this.casDecide(input.approvalRequestId, ApprovalStatus.rejected, input);
  }

  async markCancelled(input: ApprovalDecisionInput): Promise<ApprovalCasResult> {
    return this.casDecide(
      input.approvalRequestId,
      ApprovalStatus.cancelled,
      input,
    );
  }
}
