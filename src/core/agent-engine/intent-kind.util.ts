/** Language-neutral intent kind for the intent node (no locale-specific keywords in code). */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesSmallTalkHint(
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
    if (new RegExp(`^${escapeRegExp(token)}[\\s!.?,，？]*$`, 'iu').test(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Classify user message before tool routing.
 * Default is `task` unless the message matches a configured small-talk hint.
 *
 * Hints MUST come from config (`src/core/intent/smalltalk-hints.json`), not hardcoded
 * keywords in agent code. See `.cursor/rules/no-hardcoded-intent-matching.mdc`.
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
  if (matchesSmallTalkHint(normalized, configurableHints)) {
    return 'smalltalk';
  }
  return 'task';
}
