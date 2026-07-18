import { Injectable } from '@nestjs/common';
import type { ApprovalSource } from '../../../generated/prisma/client';
import type { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import { ApprovalRequestService } from './approval-request.service';
import type {
  ApprovalResumeSnapshot,
} from './approval-resume-snapshot.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import type { WriteDraft } from '../draft-review/write-draft.types';
import {
  attachWriteDraftToApprovalSnapshot,
  syncWriteDraftPresentation,
  writeDraftToPendingWrite,
} from '../draft-review/write-draft.util';
import { buildWriteDraftStepDetail } from '../page-action/page-action-run-audit.util';

export type SuspendForApprovalInput = {
  appClientId: number;
  source: ApprovalSource;
  initiatorUserId: number | null;
  approverUserId: number;
  /** 编排资产：新建/刷新审批必须有 Flow */
  flowId: number;
  flowVersion?: number | null;
  nodeId: string;
  title: string;
  /** 写草稿真值；preview / summary / pendingWrite 由此派生。 */
  writeDraft: WriteDraft;
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowNodeOutputs: Record<string, unknown>;
  scopedToolIds: number[];
  pageContext?: unknown | null;
  pageActionRunId?: number | null;
  sessionId?: string | null;
  idempotencyKey?: string | null;
  channel: ApprovalResumeSnapshot['channel'];
  stepRecorder?: PageActionRunStepRecorder;
  /** 重试再生草稿时更新既有审批单，而非新建。 */
  existingApprovalRequestId?: number | null;
};

@Injectable()
export class ApprovalGateService {
  constructor(private readonly approvalRequests: ApprovalRequestService) {}

  /**
   * 统一挂起门：创建 ApprovalRequest + 追加审计步骤（不覆盖既有 steps）。
   */
  async suspend(input: SuspendForApprovalInput) {
    const isRefresh = input.existingApprovalRequestId != null;
    let previousSnapshot: ApprovalResumeSnapshot | null = null;
    if (isRefresh) {
      const existing = await this.approvalRequests.findByIdForApprover(
        input.existingApprovalRequestId!,
        input.approverUserId,
      );
      previousSnapshot = existing
        ? this.approvalRequests.parseResumeSnapshot(existing)
        : null;
    }

    const writeDraft = syncWriteDraftPresentation({
      ...input.writeDraft,
      version: isRefresh
        ? (previousSnapshot?.writeDraft?.version ?? input.writeDraft.version) + 1
        : input.writeDraft.version,
      provenance: {
        ...input.writeDraft.provenance,
        lastEvent: isRefresh ? 'retry' : 'suspended',
      },
    });
    const pendingWrite = writeDraftToPendingWrite(writeDraft);
    const previewBlocks = writeDraft.presentation.previewBlocks;
    const summary = writeDraft.presentation.summaryText ?? null;

    let resumeSnapshot: ApprovalResumeSnapshot = {
      version: 2,
      workflowRun: input.workflowRun,
      workflowNodeOutputs: input.workflowNodeOutputs,
      pendingWrite,
      writeDraft,
      scopedToolIds: input.scopedToolIds,
      pageContext: input.pageContext ?? null,
      channel: input.channel,
      draftRetryCount: writeDraft.provenance.draftRetryCount,
      flow: {
        id: input.flowId,
        version: input.flowVersion ?? input.workflowRun.version,
      },
      suspended: {
        irNodeId:
          input.workflowRun.nodes.find((n) => n.nodeId === input.nodeId)
            ?.irNodeId ?? input.nodeId,
        phase:
          input.workflowRun.nodes.find((n) => n.nodeId === input.nodeId)
            ?.phase ?? null,
      },
      // 可选缓存，便于旧 rewind；续跑优先重载 Flow
      workflowNodeDefs: input.workflowNodeDefs,
    };

    if (input.existingApprovalRequestId != null) {
      const previousRetry = previousSnapshot?.draftRetryCount ?? 0;
      const mergedRetryCount = Math.max(
        previousRetry,
        writeDraft.provenance.draftRetryCount ?? 0,
      );
      resumeSnapshot = attachWriteDraftToApprovalSnapshot(
        {
          ...resumeSnapshot,
          draftRetryCount: mergedRetryCount,
        },
        {
          ...writeDraft,
          provenance: {
            ...writeDraft.provenance,
            draftRetryCount: mergedRetryCount,
            lastEvent: 'retry',
          },
        },
      );
      const updated = await this.approvalRequests.updatePendingSnapshot({
        approvalRequestId: input.existingApprovalRequestId,
        approverUserId: input.approverUserId,
        resumeSnapshot,
        previewBlocks,
        summary,
      });
      if (!updated) {
        throw new Error(
          `failed to refresh approval request ${input.existingApprovalRequestId}`,
        );
      }
      const approval = await this.approvalRequests.findByIdForApprover(
        input.existingApprovalRequestId,
        input.approverUserId,
      );
      if (!approval) {
        throw new Error(
          `approval request not found after refresh: ${input.existingApprovalRequestId}`,
        );
      }
      input.stepRecorder?.record({
        type: 'lifecycle',
        name: 'awaiting_approval',
        detail: {
          approvalRequestId: approval.id,
          nodeId: input.nodeId,
          flowId: input.flowId,
          refreshed: true,
          ...buildWriteDraftStepDetail(writeDraft),
        },
      });
      return approval;
    }

    const approval = await this.approvalRequests.createPending({
      appClientId: input.appClientId,
      source: input.source,
      initiatorUserId: input.initiatorUserId,
      approverUserId: input.approverUserId,
      flowId: input.flowId,
      flowVersion: input.flowVersion ?? null,
      nodeId: input.nodeId,
      title: input.title,
      summary,
      previewBlocks,
      resumeSnapshot,
      pageActionRunId: input.pageActionRunId ?? null,
      sessionId: input.sessionId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
    });

    input.stepRecorder?.record({
      type: 'lifecycle',
      name: 'awaiting_approval',
      detail: {
        approvalRequestId: approval.id,
        nodeId: input.nodeId,
        flowId: input.flowId,
        ...buildWriteDraftStepDetail(writeDraft),
      },
    });

    return approval;
  }
}
