import type { MessageBlock } from '../agent-engine/engine/message/message-blocks.types';
import type { ApprovalPendingWrite } from '../approval/approval-resume-snapshot.types';
import type { ApprovalResumeSnapshot } from '../approval/approval-resume-snapshot.types';
import type { PendingWriteToolCall } from '../../modules/chat/pending-write-confirmation.types';
import type { PendingToolObservation } from '../../modules/chat/pending-write-confirmation.types';
import type { DraftReviewDecision, DraftReviewWriteToolLike } from './draft-review.types';
import type { BuildPageWriteDraftInput, WriteDraft, WriteDraftLastEvent, WriteDraftPublic } from './write-draft.types';
export declare function renderWriteDraftPresentation(draft: Pick<WriteDraft, 'tool' | 'arguments' | 'presentation'>): {
    previewBlocks: MessageBlock[];
    serialized: string;
};
export declare function buildPageWriteDraft(input: BuildPageWriteDraftInput): WriteDraft;
export declare function syncWriteDraftPresentation(draft: WriteDraft): WriteDraft;
export declare function writeDraftToPendingWrite(draft: WriteDraft): ApprovalPendingWrite;
export declare function writeDraftToPendingWriteToolCall(draft: WriteDraft, reason?: string): PendingWriteToolCall;
export declare function syncChatGateToolCallsFromWriteDraft(input: {
    toolCalls: PendingWriteToolCall[];
    writeDraft: WriteDraft | null | undefined;
}): PendingWriteToolCall[];
export declare function resolveChatGateToolCalls(input: {
    toolCalls: PendingWriteToolCall[];
    writeDraft?: WriteDraft | null;
}): PendingWriteToolCall[];
export declare function applyDraftReviewToChatGateToolCalls(input: {
    pending: {
        toolCalls: PendingWriteToolCall[];
        writeDraft?: WriteDraft | null;
    };
    decision: DraftReviewDecision;
    scopedTools: DraftReviewWriteToolLike[];
}): PendingWriteToolCall[];
export declare function writeDraftFromPendingWrite(input: {
    pendingWrite: ApprovalPendingWrite;
    toolId?: number;
    summaryText?: string | null;
    previewBlocks?: MessageBlock[] | null;
    draftRetryCount?: number;
    version?: number;
    lastEvent?: WriteDraftLastEvent;
    composedAt?: string;
}): WriteDraft;
export declare function writeDraftFromChatToolCall(input: {
    toolCall: PendingWriteToolCall;
    toolId?: number;
    summaryText?: string | null;
    previewBlocks?: MessageBlock[];
    draftRetryCount?: number;
    version?: number;
    lastEvent?: WriteDraftLastEvent;
}): WriteDraft;
export declare function resolvePrimaryWriteDraftFromChatToolCalls(input: {
    toolCalls: PendingWriteToolCall[];
    summaryText?: string | null;
    previewBlocks?: MessageBlock[];
    draftRetryCount?: number;
    version?: number;
}): WriteDraft | null;
export declare function resolveWriteDraftFromApprovalSnapshot(snapshot: ApprovalResumeSnapshot, fallback?: {
    summary?: string | null;
    previewBlocks?: MessageBlock[] | null;
}): WriteDraft;
export declare function attachWriteDraftToApprovalSnapshot(snapshot: ApprovalResumeSnapshot, draft: WriteDraft): ApprovalResumeSnapshot;
export declare function applyDraftReviewToWriteDraft(input: {
    draft: WriteDraft;
    decision: DraftReviewDecision;
    writeTool?: DraftReviewWriteToolLike | null;
}): WriteDraft;
export declare function toWriteDraftPublic(draft: WriteDraft, input?: {
    draftRetryMax?: number;
}): WriteDraftPublic;
export declare function resolveWriteDraftForChatPending(input: {
    toolCalls: PendingWriteToolCall[];
    writeDraft?: WriteDraft | null;
    observations?: PendingToolObservation[];
    confirmedPreviewSerialized?: string | null;
    draftRetryCount?: number;
}): WriteDraft | null;
export declare function resolveWriteDraftFromChatGate(input: {
    toolCalls: PendingWriteToolCall[];
    observations?: PendingToolObservation[];
    confirmedPreviewSerialized?: string | null;
    draftRetryCount?: number;
    version?: number;
}): WriteDraft | null;
export declare function toWriteDraftPublicListFromChatToolCalls(input: {
    toolCalls: PendingWriteToolCall[];
    summaryText?: string | null;
    previewBlocks?: MessageBlock[];
    draftRetryCount?: number;
    version?: number;
}): WriteDraftPublic[];
export type BuildWriteDraftListFromChatGateInput = {
    toolCalls: PendingWriteToolCall[];
    writeDraft?: WriteDraft | null;
    writeDrafts?: WriteDraft[] | null;
    observations?: PendingToolObservation[];
    confirmedPreviewSerialized?: string | null;
    draftRetryCount?: number;
    previewBlocks?: MessageBlock[];
    summaryText?: string | null;
    version?: number;
};
export declare function buildWriteDraftListFromChatGate(input: BuildWriteDraftListFromChatGateInput): WriteDraft[];
export declare function buildWriteDraftPublicListFromChatGate(input: BuildWriteDraftListFromChatGateInput): WriteDraftPublic[];
