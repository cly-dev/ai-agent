import { Injectable } from '@nestjs/common';
import type { ToolLevel } from '../../../generated/prisma/client';
import type { ApprovalSource } from '../../../generated/prisma/client';
import type { PageActionRunStepRecorder } from '../page-action/page-action-run-steps.util';
import { ApprovalRequestService } from './approval-request.service';
import type {
  ApprovalPendingWrite,
  ApprovalResumeSnapshot,
} from './approval-resume-snapshot.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';

export type SuspendForApprovalInput = {
  appClientId: number;
  source: ApprovalSource;
  initiatorUserId: number | null;
  approverUserId: number;
  workflowId: number;
  workflowVersion: number;
  nodeId: string;
  title: string;
  summary?: string | null;
  previewBlocks?: unknown;
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowNodeOutputs: Record<string, unknown>;
  pendingWrite: ApprovalPendingWrite;
  scopedToolIds: number[];
  pageContext?: unknown | null;
  pageActionRunId?: number | null;
  sessionId?: string | null;
  idempotencyKey?: string | null;
  channel: ApprovalResumeSnapshot['channel'];
  stepRecorder?: PageActionRunStepRecorder;
};

@Injectable()
export class ApprovalGateService {
  constructor(private readonly approvalRequests: ApprovalRequestService) {}

  /**
   * 统一挂起门：创建 ApprovalRequest + 追加审计步骤（不覆盖既有 steps）。
   */
  async suspend(input: SuspendForApprovalInput) {
    const resumeSnapshot: ApprovalResumeSnapshot = {
      version: 1,
      workflowRun: input.workflowRun,
      workflowNodeDefs: input.workflowNodeDefs,
      workflowNodeOutputs: input.workflowNodeOutputs,
      pendingWrite: input.pendingWrite,
      scopedToolIds: input.scopedToolIds,
      pageContext: input.pageContext ?? null,
      channel: input.channel,
    };

    const approval = await this.approvalRequests.createPending({
      appClientId: input.appClientId,
      source: input.source,
      initiatorUserId: input.initiatorUserId,
      approverUserId: input.approverUserId,
      workflowId: input.workflowId,
      workflowVersion: input.workflowVersion,
      nodeId: input.nodeId,
      title: input.title,
      summary: input.summary ?? null,
      previewBlocks: input.previewBlocks,
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
        workflowId: input.workflowId,
        pendingWriteTool: input.pendingWrite.name,
        pendingWriteRiskLevel: input.pendingWrite.riskLevel,
      },
    });

    return approval;
  }

  buildPendingWriteFromTool(input: {
    name: string;
    arguments: Record<string, unknown>;
    riskLevel: ToolLevel;
  }): ApprovalPendingWrite {
    return {
      name: input.name.trim(),
      arguments: input.arguments,
      riskLevel: input.riskLevel,
    };
  }
}
