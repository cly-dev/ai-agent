import type { ToolLevel } from '../../../generated/prisma/client';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';
import type { WorkflowNodeDef, WorkflowRunState } from '../workflow/workflow.types';
import type { WorkflowIrNativePhase } from '../workflow/workflow-ir-native-phase.util';
import type { PendingWriteResumeContext } from '../../modules/chat/pending-write-confirmation.types';
import type { WriteDraft } from '../draft-review/write-draft.types';
export type ApprovalPendingWrite = {
    name: string;
    arguments: Record<string, unknown>;
    riskLevel: ToolLevel;
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
    flow: {
        id: number;
        version: number;
    };
    suspended: {
        irNodeId: string;
        phase?: WorkflowIrNativePhase | null;
    };
    workflowNodeDefs?: WorkflowNodeDef[];
};
export type ApprovalResumeSnapshot = ApprovalResumeSnapshotV1 | ApprovalResumeSnapshotV2;
export type ApprovalResumeSnapshotBase = Omit<ApprovalResumeSnapshotV1, 'channel'>;
export type ApprovalResumeChannelKind = ApprovalResumeChannel['kind'];
export declare function isApprovalResumeSnapshotV2(snapshot: ApprovalResumeSnapshot): snapshot is ApprovalResumeSnapshotV2;
export declare function resolveApprovalResumeNodeDefs(snapshot: ApprovalResumeSnapshot, reloadedNodes: WorkflowNodeDef[] | null | undefined): WorkflowNodeDef[];
