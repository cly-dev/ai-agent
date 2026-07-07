import type { DraftReviewDecision } from '../../../draft-review';
import {
  applyDraftReviewToChatGateToolCalls,
  assertDraftReviewToolCallsValid,
} from '../../../draft-review';
import { DraftReviewPolicyViolationError } from '../../../draft-review/sanitize-draft-review-patch.util';
import type { PendingWriteConfirmationSnapshot } from '../../../../modules/chat/pending-write-confirmation.types';
import type { AgentService } from '../../../../modules/agent/agent.service';
import type { ToolEngineService } from '../../../tool-engine/tool-engine.service';
import type { PrismaService } from '../../../../prisma/prisma.service';
import { buildEngineToolsFromAllowedWithCredentials } from '../main/runtime/agent-tool-runtime.util';
import { WriteGateDecisionRejectedError } from './write-gate-decision.error';

export async function validateWriteGateEditedToolCalls(input: {
  consumed: PendingWriteConfirmationSnapshot;
  decision: DraftReviewDecision;
  userId: number;
  agentService: AgentService;
  toolEngine: ToolEngineService;
  prisma: PrismaService;
}): Promise<void> {
  if (input.decision.action !== 'confirm_with_edits') {
    return;
  }

  const allowedTools = await input.agentService.getAllowedTools(
    input.consumed.agentId,
    input.userId,
    input.consumed.appClientId,
  );
  const { tools } = await buildEngineToolsFromAllowedWithCredentials(
    allowedTools,
    input.userId,
    input.toolEngine,
    input.prisma,
  );
  const scopedIdSet = new Set(input.consumed.resumeContext.scopedToolIds);
  const resolvedScopedTools =
    tools.filter((tool) => scopedIdSet.has(tool.id)).length > 0
      ? tools.filter((tool) => scopedIdSet.has(tool.id))
      : tools;

  try {
    const toolCallsForWrite = applyDraftReviewToChatGateToolCalls({
      pending: input.consumed,
      decision: input.decision,
      scopedTools: resolvedScopedTools,
    });

    assertDraftReviewToolCallsValid({
      toolCalls: toolCallsForWrite,
      scopedTools: resolvedScopedTools,
    });
  } catch (error) {
    if (error instanceof DraftReviewPolicyViolationError) {
      throw new WriteGateDecisionRejectedError(error.message, error.code);
    }
    const detail =
      error instanceof Error ? error.message : 'edited write arguments invalid';
    throw new WriteGateDecisionRejectedError(detail, 'EDITED_WRITE_ARGS_INVALID');
  }
}
