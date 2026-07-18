import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type {
  WorkflowNodeDef,
  WorkflowRunState,
} from '../workflow/workflow.types';
import type { WorkflowIrNativePhase } from '../workflow/workflow-ir-native-phase.util';
import type { PendingWriteResumeContext } from '../../modules/chat/pending-write-confirmation.types';
import type { WriteDraft } from '../draft-review/write-draft.types';

/** 挂起点待执行的写工具调用（与展示层解耦，写入以此为准）。 */
export type ApprovalPendingWrite = {
  name: string;
  arguments: Record<string, unknown>;
  riskLevel: ToolLevel;
};

/**
 * @deprecated 历史 chat 镜像遗留；新数据不再写入。仅用于解析旧 `resumeSnapshot` JSON。
 */
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

/** webhook 恢复通道：外部触发的幂等/回调信息（P2）。 */
export type ApprovalResumeChannelWebhook = {
  kind: 'webhook';
  idempotencyKey?: string | null;
  callbackRef?: string | null;
};

export type ApprovalResumeChannel =
  | ApprovalResumeChannelChat
  | ApprovalResumeChannelPageAction
  | ApprovalResumeChannelWebhook;

/** v1：整图 defs 快照（存量 pending 审批仍可读）。 */
export type ApprovalResumeSnapshotV1 = {
  version: 1;
  workflowRun: WorkflowRunState;
  workflowNodeDefs: WorkflowNodeDef[];
  workflowNodeOutputs: Record<string, unknown>;
  pendingWrite: ApprovalPendingWrite;
  scopedToolIds: number[];
  pageContext?: AgentChatPageContext | null;
  draftRetryCount?: number;
  writeDraft?: WriteDraft;
  channel: ApprovalResumeChannel;
};

/**
 * Plan A §4.3g v2：以 Flow 钉版本 + irNodeId 为真源，不再强制持久化整图 defs。
 * 续跑时按 flowId/flowVersion 重载 IR；defs 仅作可选兼容缓存。
 */
export type ApprovalResumeSnapshotV2 = {
  version: 2;
  workflowRun: WorkflowRunState;
  workflowNodeOutputs: Record<string, unknown>;
  pendingWrite: ApprovalPendingWrite;
  scopedToolIds: number[];
  pageContext?: AgentChatPageContext | null;
  draftRetryCount?: number;
  writeDraft?: WriteDraft;
  channel: ApprovalResumeChannel;
  flow: { id: number; version: number };
  suspended: {
    irNodeId: string;
    phase?: WorkflowIrNativePhase | null;
  };
  /** 可选缓存；续跑优先用重载图 */
  workflowNodeDefs?: WorkflowNodeDef[];
};

export type ApprovalResumeSnapshot =
  | ApprovalResumeSnapshotV1
  | ApprovalResumeSnapshotV2;

/** @deprecated 使用 ApprovalResumeSnapshotV1 字段；兼容旧引用 */
export type ApprovalResumeSnapshotBase = Omit<
  ApprovalResumeSnapshotV1,
  'channel'
>;

export type ApprovalResumeChannelKind = ApprovalResumeChannel['kind'];

export function isApprovalResumeSnapshotV2(
  snapshot: ApprovalResumeSnapshot,
): snapshot is ApprovalResumeSnapshotV2 {
  return snapshot.version === 2;
}

/** 续跑用节点定义：v2 优先外部重载，v1 / 缓存回退快照。 */
export function resolveApprovalResumeNodeDefs(
  snapshot: ApprovalResumeSnapshot,
  reloadedNodes: WorkflowNodeDef[] | null | undefined,
): WorkflowNodeDef[] {
  if (reloadedNodes && reloadedNodes.length > 0) {
    return reloadedNodes;
  }
  if (isApprovalResumeSnapshotV2(snapshot)) {
    return snapshot.workflowNodeDefs ?? [];
  }
  return snapshot.workflowNodeDefs;
}
