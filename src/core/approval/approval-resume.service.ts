import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalSource,
  PageActionRunStatus,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import { ApprovalGateService } from './approval-gate.service';
import { ApprovalRequestService } from './approval-request.service';
import { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
import type { ApprovalDecisionInput } from './approval.types';
import { resolveApproverAllowedToolIds } from './approval-resume-permission.util';
import { resumePageActionFromApprovalSnapshot } from './page-action-approval-resume.util';
import { LlmService } from '../llm/llm.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';

@Injectable()
export class ApprovalResumeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalRequests: ApprovalRequestService,
    private readonly approvalGate: ApprovalGateService,
    private readonly triggerPermission: ApprovalTriggerPermissionService,
    private readonly llmService: LlmService,
    private readonly toolEngine: ToolEngineService,
  ) {}

  async confirm(input: ApprovalDecisionInput): Promise<{ resumed: boolean }> {
    const row = await this.prisma.approvalRequest.findUnique({
      where: { id: input.approvalRequestId },
    });
    if (!row || row.approverUserId !== input.decidedByUserId) {
      throw new NotFoundException('Approval request not found');
    }
    if (row.source === ApprovalSource.chat) {
      throw new BadRequestException({
        code: 'CHAT_APPROVAL_IN_SESSION_ONLY',
        message: 'Chat write confirmation must be completed in the session',
      });
    }

    const cas = await this.approvalRequests.markApproved(input);
    if (cas.ok === false) {
      return { resumed: false };
    }

    const snapshot = this.approvalRequests.parseResumeSnapshot(row);
    await this.assertResumePermission(
      row.approverUserId,
      snapshot,
      row.id,
      {
        appClientId: row.appClientId,
        source: row.source,
        sessionId: row.sessionId,
      },
    );

    if (snapshot.channel.kind === 'page_action') {
      await resumePageActionFromApprovalSnapshot({
        snapshot,
        approvalRequestId: row.id,
        prisma: this.prisma,
        llmService: this.llmService,
        toolEngine: this.toolEngine,
        approvalGate: this.approvalGate,
      });
    }

    return { resumed: true };
  }

  async reject(input: ApprovalDecisionInput): Promise<void> {
    const rowBefore = await this.prisma.approvalRequest.findUnique({
      where: { id: input.approvalRequestId },
    });
    if (
      rowBefore?.source === ApprovalSource.chat &&
      rowBefore.approverUserId === input.decidedByUserId
    ) {
      throw new BadRequestException({
        code: 'CHAT_APPROVAL_IN_SESSION_ONLY',
        message: 'Chat write confirmation must be completed in the session',
      });
    }

    const cas = await this.approvalRequests.markRejected(input);
    if (!cas.ok) {
      return;
    }
    const row =
      rowBefore ??
      (await this.prisma.approvalRequest.findUnique({
        where: { id: input.approvalRequestId },
      }));
    if (!row?.pageActionRunId) {
      return;
    }
    const recorder = PageActionRunStepRecorder.fromJson(
      (
        await this.prisma.pageActionRun.findUnique({
          where: { id: row.pageActionRunId },
          select: { steps: true },
        })
      )?.steps,
    );
    recorder.recordLifecycle('approval_rejected', {
      approvalRequestId: row.id,
      decidedByUserId: input.decidedByUserId,
    });
    await this.prisma.pageActionRun.update({
      where: { id: row.pageActionRunId },
      data: {
        status: PageActionRunStatus.cancelled,
        finishedAt: new Date(),
        steps: recorder.toJson() as Prisma.InputJsonValue,
      },
    });
  }

  private async assertResumePermission(
    userId: number,
    snapshot: ApprovalResumeSnapshot,
    approvalRequestId: number,
    context: {
      appClientId: number;
      source: ApprovalSource;
      sessionId?: string | null;
    },
  ): Promise<void> {
    const allowedToolIds = await resolveApproverAllowedToolIds({
      approverUserId: userId,
      appClientId: context.appClientId,
      source: context.source,
      snapshot,
      sessionId: context.sessionId ?? null,
      prisma: this.prisma,
      triggerPermission: this.triggerPermission,
    });
    const decision = this.triggerPermission.evaluateForNodes({
      nodes: snapshot.workflowNodeDefs,
      allowedToolIds,
    });
    if (!decision.allowed) {
      await this.approvalRequests.markCancelled({
        approvalRequestId,
        decidedByUserId: userId,
        decisionNote: 'write tool permission revoked',
      });
      throw new NotFoundException({
        code: 'WORKFLOW_TRIGGER_PERMISSION_DENIED',
        message: 'Approver no longer has write tool permission',
      });
    }
  }
}
