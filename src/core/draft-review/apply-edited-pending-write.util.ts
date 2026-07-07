import {
  extractSubmitTextFromDraftReply,
  injectDraftIntoWriteToolArguments,
  mergeWriteToolArgumentsByParamPaths,
  satisfiesRequiredWriteToolArgs,
} from '../tool-engine/write-tool-draft-injection.util';
import { messageBlocksToPlainText, tryParseStoredMessageBlocks } from '../agent-engine/engine/message/message-blocks.util';
import type {
  DraftReviewDecision,
  DraftReviewPendingWriteLike,
  DraftReviewToolCallLike,
  DraftReviewWriteToolLike,
} from './draft-review.types';
import { resolveWriteDraftEditPolicyForToolCall } from './resolve-write-draft-edit-policy.util';
import {
  assertNoLockedFieldChanges,
  DraftReviewPolicyViolationError,
  sanitizeDraftReviewArgumentsPatch,
} from './sanitize-draft-review-patch.util';

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

function normalizeDecisionForPolicy(input: {
  pending: DraftReviewPendingWriteLike;
  decision: DraftReviewDecision;
  writeTool?: DraftReviewWriteToolLike | null;
}): DraftReviewDecision {
  if (input.decision.action !== 'confirm_with_edits') {
    return input.decision;
  }
  const policy = resolveWriteDraftEditPolicyForToolCall({
    writeTool: input.writeTool,
    arguments: input.pending.arguments,
  });
  if (!policy) {
    return input.decision;
  }
  let editedPendingWriteArguments =
    input.decision.editedPendingWriteArguments;
  if (!policy.allowArgumentsPatch) {
    editedPendingWriteArguments = null;
  } else if (editedPendingWriteArguments) {
    const sanitized = sanitizeDraftReviewArgumentsPatch(
      editedPendingWriteArguments,
      policy,
    );
    const dropped = Object.keys(editedPendingWriteArguments).filter(
      (key) => !(key in sanitized),
    );
    if (dropped.length > 0) {
      throw new DraftReviewPolicyViolationError(
        'EDITED_FIELD_NOT_ALLOWED',
        `arguments patch contains non-editable fields: ${dropped.join(', ')}`,
      );
    }
    editedPendingWriteArguments = sanitized;
  }
  return {
    ...input.decision,
    editedPendingWriteArguments,
  };
}

function decisionHasUserEdits(decision: DraftReviewDecision): boolean {
  if (decision.editedPreviewSerialized?.trim()) {
    return true;
  }
  const patch = decision.editedPendingWriteArguments;
  return patch != null && Object.keys(patch).length > 0;
}

function assertWriteToolResolvedForEdits(
  writeTool: DraftReviewWriteToolLike | null | undefined,
  toolName: string,
): asserts writeTool is DraftReviewWriteToolLike {
  if (!writeTool) {
    throw new DraftReviewPolicyViolationError(
      'WRITE_TOOL_NOT_RESOLVED',
      `write tool not resolved for edit policy enforcement: ${toolName}`,
    );
  }
}

export function applyDraftReviewToPendingWrite(input: {
  pending: DraftReviewPendingWriteLike;
  decision: DraftReviewDecision;
  writeTool?: DraftReviewWriteToolLike | null;
}): DraftReviewPendingWriteLike {
  if (input.decision.action !== 'confirm_with_edits') {
    return input.pending;
  }

  assertWriteToolResolvedForEdits(input.writeTool, input.pending.name);

  const decision = normalizeDecisionForPolicy({
    ...input,
    writeTool: input.writeTool,
  });
  const beforeArguments = { ...input.pending.arguments };

  let argumentsPatch = { ...input.pending.arguments };
  if (decision.editedPendingWriteArguments && input.writeTool) {
    argumentsPatch = mergeWriteToolArgumentsByParamPaths(
      argumentsPatch,
      decision.editedPendingWriteArguments,
      input.writeTool,
    );
  }

  const submitText = resolveSubmitTextFromDecision(decision);
  if (submitText && input.writeTool) {
    argumentsPatch = injectDraftIntoWriteToolArguments(
      argumentsPatch,
      submitText,
      input.writeTool,
    );
  }

  const policy = resolveWriteDraftEditPolicyForToolCall({
    writeTool: input.writeTool,
    arguments: beforeArguments,
  });
  if (policy) {
    assertNoLockedFieldChanges({
      before: beforeArguments,
      after: argumentsPatch,
      policy,
    });
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
  if (input.toolCalls.length > 1 && decisionHasUserEdits(input.decision)) {
    throw new DraftReviewPolicyViolationError(
      'MULTI_WRITE_EDIT_NOT_SUPPORTED',
      'confirm_with_edits is not supported when multiple write tools are pending',
    );
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
