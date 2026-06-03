/** Language-neutral intent kind for the intent node (no locale-specific keywords in code). */

const SMALLTALK_GREETING_RE =
  /^(hi|hello|hey|yo|sup|howdy|good morning|good afternoon|good evening|good night)[\s!.?,]*$/i;

const SMALLTALK_THANKS_RE = /^(thanks|thank you|thx)[\s!.?,]*$/i;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isLikelySmallTalk(
  normalized: string,
  configurableHints: readonly string[],
): boolean {
  for (const hint of configurableHints) {
    const token = hint.trim().toLowerCase();
    if (!token) {
      continue;
    }
    if (normalized === token) {
      return true;
    }
    if (new RegExp(`^${escapeRegExp(token)}[\\s!.?,]*$`, 'i').test(normalized)) {
      return true;
    }
  }
  if (SMALLTALK_GREETING_RE.test(normalized)) {
    return true;
  }
  if (SMALLTALK_THANKS_RE.test(normalized)) {
    return true;
  }
  return false;
}

/**
 * Classify user message before tool routing.
 * Default is `task` unless the message is clearly small talk.
 * Optional hints come from `smalltalk-hints.json` (tenant-configurable).
 */
export function detectIntentKind(
  userMessage: string,
  configurableHints: readonly string[] = [],
): 'task' | 'smalltalk' | 'unclear' {
  const text = userMessage.trim();
  if (!text) {
    return 'unclear';
  }
  if (!/[\p{L}\p{N}]/u.test(text)) {
    return 'unclear';
  }
  const normalized = text.toLowerCase();
  if (isLikelySmallTalk(normalized, configurableHints)) {
    return 'smalltalk';
  }
  return 'task';
}
