import type { AgentChatPageContext } from '../host-bridge/page-context.types';
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
  /** 入队时的 session generation；消费时与当前 generation 不一致则跳过（supersede 后的过期 job）。 */
  enqueueGeneration?: number;
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
