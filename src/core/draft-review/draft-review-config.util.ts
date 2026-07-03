const DEFAULT_MAX_RETRIES = 3;

export function resolveDraftReviewMaxRetries(): number {
  const raw = process.env.DRAFT_REVIEW_MAX_RETRIES?.trim();
  if (!raw) {
    return DEFAULT_MAX_RETRIES;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_MAX_RETRIES;
  }
  return parsed;
}
