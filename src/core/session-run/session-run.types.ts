import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { ApprovalResumeSnapshot } from '../approval/approval-resume-snapshot.types';
import type { RunCancellationToken } from './run-cancellation-token';

export type RunJobKind =
  | 'chat_turn'
  | 'write_confirm'
  | 'write_cancel';

export type RunEnqueuePolicy = 'supersede' | 'queue';

export type SupersedeReason = 'user_message' | 'cancel_api';

export type RunJob = {
  jobId: string;
  kind: RunJobKind;
  sessionId: string;
  userId: number;
  appClientId: number;
  userMessageId?: number;
  input: string;
  requestedSkillId?: number;
  pageContext?: AgentChatPageContext | null;
  /** 收件箱 confirm：从 ApprovalRequest 快照续跑，与会话内 confirm 共用队列。 */
  approvalInboxSnapshot?: ApprovalResumeSnapshot;
  approvalRequestId?: number;
};

export type RunExecutionHandle = {
  generation: number;
  token: RunCancellationToken;
  supersedeReason: SupersedeReason | null;
};

export type CancelSessionRunResult = {
  superseded: boolean;
  generation: number;
  cancelledRunId: number | null;
};

export type SessionRunActiveSnapshot = {
  runId: number;
  turnId: number;
  generation: number;
};

export type SessionRunStateSnapshot = {
  generation: number;
  activeRunId: number | null;
  activeTurnId: number | null;
  /** 本进程内存队列 + Redis 队列合计 */
  pendingJobCount: number;
  redisBacked: boolean;
};

export type SessionRunSupersedeEvent = {
  sessionId: string;
  generation: number;
  reason: SupersedeReason;
};
