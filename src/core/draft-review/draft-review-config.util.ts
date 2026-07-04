/** `null` 表示不限制重试次数。 */
export function resolveDraftReviewMaxRetries(): number | null {
  const raw = process.env.DRAFT_REVIEW_MAX_RETRIES?.trim();
  if (!raw || raw.toLowerCase() === 'unlimited') {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}
