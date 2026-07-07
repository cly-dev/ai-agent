import {
  assertDraftReviewToolCallsValid,
} from '../draft-review';
import type { DraftReviewDecision } from '../draft-review';
import {
  applyDraftReviewToWriteDraft,
  attachWriteDraftToApprovalSnapshot,
  resolveWriteDraftFromApprovalSnapshot,
} from '../draft-review/write-draft.util';
import type { ApprovalResumeSnapshot } from './approval-resume-snapshot.types';
import type { ToolEngineService } from '../tool-engine/tool-engine.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { buildEngineToolsFromAllowedWithCredentials } from '../agent-engine/engine/main/runtime/agent-tool-runtime.util';
import { BadRequestException } from '@nestjs/common';
import { DraftReviewPolicyViolationError } from '../draft-review/sanitize-draft-review-patch.util';

export async function resolveApprovalSnapshotForDecision(input: {
  snapshot: ApprovalResumeSnapshot;
  decision: DraftReviewDecision | null;
  userId: number;
  prisma: PrismaService;
  toolEngine: ToolEngineService;
}): Promise<ApprovalResumeSnapshot> {
  const decision = input.decision;
  if (!decision || decision.action !== 'confirm_with_edits') {
    return input.snapshot;
  }

  const allowedTools = await input.prisma.tool.findMany({
    where: { id: { in: input.snapshot.scopedToolIds } },
    include: { integration: true },
  });
  const { tools: resolvedScopedTools } =
    await buildEngineToolsFromAllowedWithCredentials(
      allowedTools,
      input.userId,
      input.toolEngine,
      input.prisma,
    );
  const draft = resolveWriteDraftFromApprovalSnapshot(input.snapshot);
  const writeTool =
    resolvedScopedTools.find(
      (tool) => tool.name === draft.tool.name,
    ) ?? null;
  if (!writeTool) {
    throw new BadRequestException({
      code: 'WRITE_TOOL_NOT_RESOLVED',
      message: `write tool not found for draft: ${draft.tool.name}`,
    });
  }

  let editedDraft;
  try {
    editedDraft = applyDraftReviewToWriteDraft({
      draft,
      decision,
      writeTool,
    });
  } catch (error) {
    if (error instanceof DraftReviewPolicyViolationError) {
      throw new BadRequestException({
        code: error.code,
        message: error.message,
      });
    }
    throw error;
  }

  try {
    assertDraftReviewToolCallsValid({
      toolCalls: [
        {
          name: editedDraft.tool.name,
          arguments: editedDraft.arguments,
          riskLevel: String(editedDraft.tool.riskLevel),
        },
      ],
      scopedTools: resolvedScopedTools,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'edited write arguments invalid';
    throw new BadRequestException({
      code: 'EDITED_WRITE_ARGS_INVALID',
      message: detail,
    });
  }

  return attachWriteDraftToApprovalSnapshot(input.snapshot, editedDraft);
}
