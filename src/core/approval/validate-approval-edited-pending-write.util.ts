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
import { buildEngineToolsFromAllowed } from '../agent-engine/engine/main/runtime/agent-tool-runtime.util';
import { BadRequestException } from '@nestjs/common';

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
  const { tools: resolvedScopedTools } = buildEngineToolsFromAllowed(
    allowedTools,
    input.userId,
    input.toolEngine,
  );
  const draft = resolveWriteDraftFromApprovalSnapshot(input.snapshot);
  const writeTool =
    resolvedScopedTools.find(
      (tool) => tool.name === draft.tool.name,
    ) ?? null;

  const editedDraft = applyDraftReviewToWriteDraft({
    draft,
    decision,
    writeTool,
  });

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
