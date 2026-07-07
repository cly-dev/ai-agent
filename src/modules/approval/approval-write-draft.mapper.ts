import type { ApprovalResumeSnapshot } from '../../core/approval/approval-resume-snapshot.types';
import { resolveWriteDraftEditPolicyForToolCall } from '../../core/draft-review/resolve-write-draft-edit-policy.util';
import type { DraftReviewWriteToolLike } from '../../core/draft-review/draft-review.types';
import type { WriteDraftEditPolicy, WriteDraftPublic } from '../../core/draft-review/write-draft.types';
import {
  resolveWriteDraftFromApprovalSnapshot,
  toWriteDraftPublic,
} from '../../core/draft-review/write-draft.util';
import type { MessageBlock } from '../../core/agent-engine/engine/message/message-blocks.types';

export type ApprovalWriteDraftPayload = {
  writeDraft: WriteDraftPublic;
  editPolicy: WriteDraftEditPolicy | null;
};

export function resolveApprovalRowToolId(row: {
  resumeSnapshot: unknown;
}): number | null {
  const snapshot = row.resumeSnapshot as ApprovalResumeSnapshot;
  const toolId = snapshot.writeDraft?.tool?.toolId;
  return typeof toolId === 'number' && toolId > 0 ? toolId : null;
}

export function extractWriteDraftPublicFromApprovalRow(row: {
  resumeSnapshot: unknown;
  summary?: string | null;
  previewBlocks?: unknown;
}): WriteDraftPublic {
  const snapshot = row.resumeSnapshot as ApprovalResumeSnapshot;
  const previewBlocks = Array.isArray(row.previewBlocks)
    ? (row.previewBlocks as WriteDraftPublic['presentation']['previewBlocks'])
    : null;
  const draft = resolveWriteDraftFromApprovalSnapshot(snapshot, {
    summary: row.summary ?? null,
    previewBlocks,
  });
  return toWriteDraftPublic(draft);
}

export function buildApprovalWriteDraftPayload(
  row: {
    resumeSnapshot: unknown;
    summary?: string | null;
    previewBlocks?: unknown;
  },
  writeTool?: DraftReviewWriteToolLike | null,
): ApprovalWriteDraftPayload {
  const snapshot = row.resumeSnapshot as ApprovalResumeSnapshot;
  const previewBlocks = Array.isArray(row.previewBlocks)
    ? (row.previewBlocks as MessageBlock[])
    : null;
  const draft = resolveWriteDraftFromApprovalSnapshot(snapshot, {
    summary: row.summary ?? null,
    previewBlocks,
  });
  const writeDraft = toWriteDraftPublic(draft);
  const editPolicy = resolveWriteDraftEditPolicyForToolCall({
    writeTool: writeTool ?? null,
    arguments: draft.arguments,
  });
  return { writeDraft, editPolicy };
}
