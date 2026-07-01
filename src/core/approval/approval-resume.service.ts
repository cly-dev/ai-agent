import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PageActionRunStatus, Prisma, type ApprovalSource } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import { isChatApprovalSnapshot } from './approval-resume-snapshot.types';
import { ApprovalGateService } from './approval-gate.service';
import { ApprovalRequestService } from './approval-request.service';
import { ApprovalTriggerPermissionService } from './approval-trigger-permission.service';
import type { ApprovalDecisionInput } from './approval.types';
import { resolveApproverAllowedToolIds } from './approval-resume-permission.util';
import { resumePageActionFromApprovalSnapshot } from './page-action-approval-resume.util';
import { appendChatApprovalRejectedAuditToPrimaryRun } from './chat-approval-run-audit.util';
import { SessionRunCoordinator } from '../session-run/session-run-coordinator.service';
import { AgentRunSseGateway } from '../session-run/agent-run-sse.gateway';
import { PendingWriteConfirmationStore } from '../../modules/chat/pending-write-confirmation.store';
import { LlmService } from '../llm/llm.service';
import { ToolEngineService } from '../tool-engine/tool-engine.service';

@Injectable()
export class ApprovalResumeService {
  private readonly logger = new Logger(ApprovalResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalRequests: ApprovalRequestService,
    private readonly approvalGate: ApprovalGateService,
    private readonly triggerPermission: ApprovalTriggerPermissionService,
    private readonly llmService: LlmService,
    private readonly toolEngine: ToolEngineService,
    private readonly pendingWriteConfirmationStore: PendingWriteConfirmationStore,
    private readonly runSse: AgentRunSseGateway,
    @Inject(forwardRef(() => SessionRunCoordinator))
    private readonly sessionRunCoordinator: SessionRunCoordinator,
  ) {}

  async confirm(input: ApprovalDecisionInput): Promise<{ resumed: boolean }> {
    const cas = await this.approvalRequests.markApproved(input);
    if (cas.ok === false) {
      return { resumed: false };
    }

    const row = await this.prisma.approvalRequest.findUnique({
      where: { id: input.approvalRequestId },
    });
    if (!row) {
      throw new NotFoundException('Approval request not found');
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
    } else if (isChatApprovalSnapshot(snapshot)) {
      await this.resumeChatFromInboxConfirm({
        snapshot,
        approvalRequestId: row.id,
        appClientId: row.appClientId,
        decidedByUserId: input.decidedByUserId,
      });
    }

    return { resumed: true };
  }

  async reject(input: ApprovalDecisionInput): Promise<void> {
    const rowBefore = await this.prisma.approvalRequest.findUnique({
      where: { id: input.approvalRequestId },
    });
    const cas = await this.approvalRequests.markRejected(input);
    if (!cas.ok) {
      return;
    }
    const row =
      rowBefore ??
      (await this.prisma.approvalRequest.findUnique({
        where: { id: input.approvalRequestId },
      }));
    if (!row) {
      return;
    }
    const snapshot = this.approvalRequests.parseResumeSnapshot(row);
    if (isChatApprovalSnapshot(snapshot)) {
      await this.rejectChatFromInbox({
        snapshot,
        approvalRequestId: row.id,
        decidedByUserId: input.decidedByUserId,
        decisionNote: input.decisionNote ?? null,
      });
    }
    if (!row.pageActionRunId) {
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

  private async resumeChatFromInboxConfirm(input: {
    snapshot: ApprovalResumeSnapshot;
    approvalRequestId: number;
    appClientId: number;
    decidedByUserId: number;
  }): Promise<void> {
    if (!isChatApprovalSnapshot(input.snapshot)) {
      return;
    }
    const { sessionId, runId } = input.snapshot.channel;
    try {
      await this.sessionRunCoordinator.enqueueApprovalInboxResumeFromSnapshot({
        userId: input.decidedByUserId,
        sessionId,
        appClientId: input.appClientId,
        pageContext: input.snapshot.pageContext ?? null,
        snapshot: input.snapshot,
        approvalRequestId: input.approvalRequestId,
      });
    } catch (error) {
      this.logger.warn(
        `chat inbox confirm resume failed sessionId=${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async rejectChatFromInbox(input: {
    snapshot: ApprovalResumeSnapshot;
    approvalRequestId: number;
    decidedByUserId: number;
    decisionNote?: string | null;
  }): Promise<void> {
    if (!isChatApprovalSnapshot(input.snapshot)) {
      return;
    }
    const { sessionId, runId, turnId } = input.snapshot.channel;
    await appendChatApprovalRejectedAuditToPrimaryRun({
      prisma: this.prisma,
      primaryRunId: runId,
      approvalRequestId: input.approvalRequestId,
      rejectChannel: 'inbox_reject',
      decidedByUserId: input.decidedByUserId,
      decisionNote: input.decisionNote,
    });
    const pending = await this.pendingWriteConfirmationStore.get(
      sessionId,
      input.decidedByUserId,
    );
    if (!pending || pending.runId !== runId) {
      return;
    }
    await this.pendingWriteConfirmationStore.clear(sessionId);
    this.runSse.purgeWriteConfirmationGate(sessionId, runId);
    this.runSse.emitWriteConfirmationCancelled(sessionId, {
      runId,
      turnId,
      message: '已拒绝操作。',
    });
  }
}
