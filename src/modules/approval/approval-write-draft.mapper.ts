import type { ApprovalRequest } from '../../../generated/prisma/client';
import {
  resolveWriteDraftFromApprovalSnapshot,
  toWriteDraftPublic,
} from '../../core/draft-review/write-draft.util';
import type { ApprovalResumeSnapshot } from '../../core/approval/approval-resume-snapshot.types';
import type { WriteDraftPublic } from '../../core/draft-review/write-draft.types';

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
