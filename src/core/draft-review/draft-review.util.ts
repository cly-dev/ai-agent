import {
  DRAFT_REVIEW_ACTIONS,
  type DraftReviewAction,
  type DraftReviewDecision,
} from './draft-review.types';

export function isDraftReviewAction(value: unknown): value is DraftReviewAction {
  return (
    typeof value === 'string' &&
    (DRAFT_REVIEW_ACTIONS as readonly string[]).includes(value)
  );
}

export function normalizeDraftReviewDecision(
  input: DraftReviewDecision | null | undefined,
): DraftReviewDecision | null {
  if (!input || !isDraftReviewAction(input.action)) {
    return null;
  }
  const editedPreviewSerialized =
    typeof input.editedPreviewSerialized === 'string'
      ? input.editedPreviewSerialized.trim() || null
      : null;
  const editedPendingWriteArguments =
    input.editedPendingWriteArguments &&
    typeof input.editedPendingWriteArguments === 'object' &&
    !Array.isArray(input.editedPendingWriteArguments)
      ? input.editedPendingWriteArguments
      : null;
  const retryInstruction =
    typeof input.retryInstruction === 'string'
      ? input.retryInstruction.trim() || null
      : null;

  if (input.action === 'confirm_with_edits') {
    if (!editedPreviewSerialized && !editedPendingWriteArguments) {
      return null;
    }
  }
  if (input.action === 'retry' && !retryInstruction) {
    return null;
  }

  return {
    action: input.action,
    editedPreviewSerialized,
    editedPendingWriteArguments,
    retryInstruction,
  };
}

export function draftReviewDecisionFromLegacyFlags(input: {
  confirmWrite?: boolean;
  cancelWrite?: boolean;
}): DraftReviewDecision | null {
  if (input.cancelWrite) {
    return { action: 'cancel' };
  }
  if (input.confirmWrite) {
    return { action: 'confirm' };
  }
  return null;
}

export function buildRetryUserMessage(input: {
  baseUserMessage: string;
  retryInstruction: string;
}): string {
  const base = input.baseUserMessage.trim();
  const instruction = input.retryInstruction.trim();
  if (!instruction) {
    return base;
  }
  if (!base) {
    return instruction;
  }
  return `${base}\n\n[Regenerate request]: ${instruction}`;
}
