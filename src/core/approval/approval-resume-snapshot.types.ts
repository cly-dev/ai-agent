import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type {
  WorkflowNodeDef,
  WorkflowRunState,
} from '../workflow/workflow.types';
import type { PendingWriteResumeContext } from '../../modules/chat/pending-write-confirmation.types';

/** 挂起点待执行的写工具调用（与展示层解耦，写入以此为准）。 */
export type ApprovalPendingWrite = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel: ToolLevel;
};

/**
 * 触发无关的恢复上下文：从审批挂起点续跑所需的 workflow 执行态。
 * 由具体触发链路（chat / pageAction / webhook）在 `channel` 分支补充各自恢复信息。
 */
export type ApprovalResumeSnapshotBase = {
  version: 1;
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowNodeOutputs: Record<string, unknown>;
  pendingWrite: ApprovalPendingWrite;
  scopedToolIds: number[];
  pageContext?: AgentChatPageContext | null;
};

/** chat 恢复通道：复用现有实时确认恢复上下文。 */
export type ApprovalResumeChannelChat = {
  kind: 'chat';
  sessionId: string;
  runId: number;
  turnId: number;
  resume: PendingWriteResumeContext;
};

/** pageAction 恢复通道：回链 PageActionRun。 */
export type ApprovalResumeChannelPageAction = {
  kind: 'page_action';
  pageActionRunId: number;
};

/** webhook 恢复通道：外部触发的幂等/回调信息（P2 明确）。 */
export type ApprovalResumeChannelWebhook = {
  kind: 'webhook';
  idempotencyKey?: string | null;
  callbackRef?: string | null;
};

export type ApprovalResumeChannel =
  | ApprovalResumeChannelChat
  | ApprovalResumeChannelPageAction
  | ApprovalResumeChannelWebhook;

/**
 * 序列化存入 `ApprovalRequest.resumeSnapshot` 的通用恢复快照。
 * 恢复入口按 `channel.kind` 分派到对应 runner，engine 主体逻辑复用。
 */
export type ApprovalResumeSnapshot = ApprovalResumeSnapshotBase & {
  channel: ApprovalResumeChannel;
};

export type ApprovalResumeChannelKind = ApprovalResumeChannel['kind'];

export function isChatApprovalSnapshot(
  snapshot: ApprovalResumeSnapshot,
): snapshot is ApprovalResumeSnapshot & {
  channel: ApprovalResumeChannelChat;
} {
  return snapshot.channel.kind === 'chat';
}
