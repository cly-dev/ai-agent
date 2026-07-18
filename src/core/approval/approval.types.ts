import type { DraftReviewDecision } from '../draft-review';
import type {
  ApprovalSource,
  ApprovalStatus,
} from '../../../generated/prisma/client';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';

export type CreateApprovalRequestInput = {
  appClientId: number;
  source: ApprovalSource;
  initiatorUserId: number | null;
  approverUserId: number;
  /** @deprecated 运行时不再写入；仅兼容旧行读出 */
  workflowId?: number | null;
  workflowVersion?: number | null;
  /** 编排资产：新建审批必须有 Flow */
  flowId: number;
  flowVersion?: number | null;
  nodeId: string;
  title: string;
  summary?: string | null;
  previewBlocks?: unknown;
  resumeSnapshot: ApprovalResumeSnapshot;
  pageActionRunId?: number | null;
  sessionId?: string | null;
  idempotencyKey?: string | null;
};

export type ApprovalDecisionInput = {
  approvalRequestId: number;
  decidedByUserId: number;
  decisionNote?: string | null;
  decision?: DraftReviewDecision | null;
};

export type ApprovalCasResult =
  | { ok: true; previousStatus: ApprovalStatus }
  | { ok: false; reason: 'not_found' | 'not_pending' | 'already_decided' };
