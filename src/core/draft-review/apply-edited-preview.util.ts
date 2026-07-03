import type { DraftReviewDecision } from './draft-review.types';

export function resolveConfirmedPreviewSerialized(input: {
  decision: DraftReviewDecision;
  gatePreviewSerialized: string | null | undefined;
}): string | null {
  if (
    input.decision.action === 'confirm_with_edits' &&
    input.decision.editedPreviewSerialized?.trim()
  ) {
    return input.decision.editedPreviewSerialized.trim();
  }
  return input.gatePreviewSerialized?.trim() || null;
}
