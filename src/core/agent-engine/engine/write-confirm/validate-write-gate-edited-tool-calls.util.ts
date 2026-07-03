import type { DraftReviewDecision } from '../../../draft-review';
import {
  applyDraftReviewToChatGateToolCalls,
  assertDraftReviewToolCallsValid,
} from '../../../draft-review';
import type { PendingWriteConfirmationSnapshot } from '../../../../modules/chat/pending-write-confirmation.types';
import type { AgentService } from '../../../../modules/agent/agent.service';
import type { ToolEngineService } from '../../../tool-engine/tool-engine.service';
import { buildEngineToolsFromAllowed } from '../main/runtime/agent-tool-runtime.util';
import { WriteGateDecisionRejectedError } from './write-gate-decision.error';

export async function validateWriteGateEditedToolCalls(input: {
  consumed: PendingWriteConfirmationSnapshot;
  decision: DraftReviewDecision;
  userId: number;
  agentService: AgentService;
  toolEngine: ToolEngineService;
}): Promise<void> {
  if (input.decision.action !== 'confirm_with_edits') {
    return;
  }

  const allowedTools = await input.agentService.getAllowedTools(
    input.consumed.agentId,
    input.userId,
    input.consumed.appClientId,
  );
  const { tools } = buildEngineToolsFromAllowed(
    allowedTools,
    input.userId,
    input.toolEngine,
  );
  const scopedIdSet = new Set(input.consumed.resumeContext.scopedToolIds);
  const resolvedScopedTools =
    tools.filter((tool) => scopedIdSet.has(tool.id)).length > 0
      ? tools.filter((tool) => scopedIdSet.has(tool.id))
      : tools;

  const toolCallsForWrite = applyDraftReviewToChatGateToolCalls({
    pending: input.consumed,
    decision: input.decision,
    scopedTools: resolvedScopedTools,
  });

  try {
    assertDraftReviewToolCallsValid({
      toolCalls: toolCallsForWrite,
      scopedTools: resolvedScopedTools,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : 'edited write arguments invalid';
    throw new WriteGateDecisionRejectedError(detail, 'EDITED_WRITE_ARGS_INVALID');
  }
}
