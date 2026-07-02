import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import type { PendingWriteResumeContext } from '../../modules/chat/pending-write-confirmation.types';
export type ApprovalPendingWrite = {
    name: string;
    arguments: Record<string, unknown>;
    riskLevel: ToolLevel;
};
export type ApprovalResumeSnapshotBase = {
    version: 1;
    workflowRun: WorkflowRunState;
    workflowNodeDefs: WorkflowNodeDef[];
    workflowNodeOutputs: Record<string, unknown>;
    pendingWrite: ApprovalPendingWrite;
    scopedToolIds: number[];
    pageContext?: AgentChatPageContext | null;
};
export type ApprovalResumeChannelChat = {
    kind: 'chat';
    sessionId: string;
    runId: number;
    turnId: number;
    resume: PendingWriteResumeContext;
};
export type ApprovalResumeChannelPageAction = {
    kind: 'page_action';
    pageActionRunId: number;
};
export type ApprovalResumeChannelWebhook = {
    kind: 'webhook';
    idempotencyKey?: string | null;
    callbackRef?: string | null;
};
export type ApprovalResumeChannel = ApprovalResumeChannelChat | ApprovalResumeChannelPageAction | ApprovalResumeChannelWebhook;
export type ApprovalResumeSnapshot = ApprovalResumeSnapshotBase & {
    channel: ApprovalResumeChannel;
};
export type ApprovalResumeChannelKind = ApprovalResumeChannel['kind'];
