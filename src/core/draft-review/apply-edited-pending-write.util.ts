import {
  extractSubmitTextFromDraftReply,
  injectDraftIntoWriteToolArguments,
  satisfiesRequiredWriteToolArgs,
} from '../tool-engine/write-tool-draft-injection.util';
import { messageBlocksToPlainText, tryParseStoredMessageBlocks } from '../agent-engine/engine/message/message-blocks.util';
import type {
  DraftReviewDecision,
  DraftReviewPendingWriteLike,
  DraftReviewToolCallLike,
  DraftReviewWriteToolLike,
} from './draft-review.types';

function mergeArguments(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...base,
    ...patch,
  };
}

function resolveSubmitTextFromDecision(
  decision: DraftReviewDecision,
): string | null {
  if (decision.editedPreviewSerialized?.trim()) {
    const blocks = tryParseStoredMessageBlocks(decision.editedPreviewSerialized);
    const plain = blocks?.length
      ? messageBlocksToPlainText(blocks).trim()
      : decision.editedPreviewSerialized.trim();
    if (plain) {
      return extractSubmitTextFromDraftReply(plain) || plain;
    }
  }
  return null;
}

export function applyDraftReviewToPendingWrite(input: {
  pending: DraftReviewPendingWriteLike;
  decision: DraftReviewDecision;
  writeTool?: DraftReviewWriteToolLike | null;
}): DraftReviewPendingWriteLike {
  if (input.decision.action !== 'confirm_with_edits') {
    return input.pending;
  }

  let argumentsPatch = { ...input.pending.arguments };
  if (input.decision.editedPendingWriteArguments) {
    argumentsPatch = mergeArguments(
      argumentsPatch,
      input.decision.editedPendingWriteArguments,
    );
  }

  const submitText = resolveSubmitTextFromDecision(input.decision);
  if (submitText && input.writeTool) {
    argumentsPatch = injectDraftIntoWriteToolArguments(
      argumentsPatch,
      submitText,
      input.writeTool,
    );
  }

  return {
    ...input.pending,
    arguments: argumentsPatch,
  };
}

export function applyDraftReviewToToolCalls(input: {
  toolCalls: DraftReviewToolCallLike[];
  decision: DraftReviewDecision;
  scopedTools: DraftReviewWriteToolLike[];
}): DraftReviewToolCallLike[] {
  if (input.decision.action !== 'confirm_with_edits') {
    return input.toolCalls;
  }
  const byName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
  return input.toolCalls.map((call) => {
    const writeTool = byName.get(call.name) ?? null;
    return {
      ...call,
      ...applyDraftReviewToPendingWrite({
        pending: call,
        decision: input.decision,
        writeTool,
      }),
    };
  });
}

export function assertDraftReviewToolCallsValid(input: {
  toolCalls: DraftReviewToolCallLike[];
  scopedTools: DraftReviewWriteToolLike[];
}): void {
  const byName = new Map(input.scopedTools.map((tool) => [tool.name, tool]));
  for (const call of input.toolCalls) {
    const def = byName.get(call.name);
    if (!def) {
      continue;
    }
    if (!satisfiesRequiredWriteToolArgs(call.arguments, def)) {
      throw new Error(`edited write arguments failed schema validation for ${call.name}`);
    }
  }
}
