import { resolveDraftReviewMaxRetries } from './draft-review-config.util';

export type DraftRetryBudget = {
  used: number;
  /** `null` = 不限制 */
  max: number | null;
  remaining: number | null;
  canRetry: boolean;
};

export function resolveDraftRetryBudget(
  draftRetryCount: number | null | undefined,
): DraftRetryBudget {
  const used = Math.max(0, draftRetryCount ?? 0);
  const max = resolveDraftReviewMaxRetries();
  if (max === null) {
    return {
      used,
      max: null,
      remaining: null,
      canRetry: true,
    };
  }
  const remaining = Math.max(0, max - used);
  return {
    used,
    max,
    remaining,
    canRetry: remaining > 0,
  };
}

export function canRequestDraftRetry(
  draftRetryCount: number | null | undefined,
): boolean {
  return resolveDraftRetryBudget(draftRetryCount).canRetry;
}

export function resolveDraftRetryCountAfterRegeneration(input: {
  previousCount: number | null | undefined;
  regeneratedFromRetry: boolean;
}): number {
  const base = Math.max(0, input.previousCount ?? 0);
  if (!input.regeneratedFromRetry) {
    return base;
  }
  return base + 1;
}
