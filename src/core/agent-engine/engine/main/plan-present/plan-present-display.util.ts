import { extractSubmitTextFromDraftReply } from '../../../../tool-engine/write-tool-draft-injection.util';

const MIN_PRESENT_CONTEXT_CHARS = 12;

function normalizeComparableText(text: string): string {
  return text.replace(/\s/g, '');
}

/** 用户层展示是否仅为机器层 submit 正文（缺少操作说明语境）。 */
export function isBareMachineSubmitDisplay(
  displayDraft: string,
  machineSubmit: string | null | undefined,
): boolean {
  const display = displayDraft.trim();
  const submit = machineSubmit?.trim() ?? '';
  if (!display || !submit) {
    return false;
  }
  if (normalizeComparableText(display) === normalizeComparableText(submit)) {
    return true;
  }
  const fromFence = extractSubmitTextFromDraftReply(display);
  if (
    fromFence &&
    normalizeComparableText(fromFence) === normalizeComparableText(submit)
  ) {
    const outsideFence = display
      .replace(/```[\w-]*\n[\s\S]*?```/g, '')
      .trim();
    return (
      outsideFence.replace(/\s/g, '').length < MIN_PRESENT_CONTEXT_CHARS
    );
  }
  return false;
}
