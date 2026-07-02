import { Injectable } from '@nestjs/common';
import {
  ApprovalSource,
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

/** 收件箱可见的审批来源（chat 写确认走会话内路径，不进收件箱）。 */
export const APPROVAL_INBOX_SOURCES = [
  ApprovalSource.page_action,
  ApprovalSource.webhook,
] as const satisfies readonly ApprovalSource[];

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

  async findByIdForApprover(
    approvalRequestId: number,
    approverUserId: number,
  ): Promise<ApprovalRequest | null> {
    return this.prisma.approvalRequest.findFirst({
      where: {
        id: approvalRequestId,
        approverUserId,
        source: { in: [...APPROVAL_INBOX_SOURCES] },
      },
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
        source: { in: [...APPROVAL_INBOX_SOURCES] },
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
