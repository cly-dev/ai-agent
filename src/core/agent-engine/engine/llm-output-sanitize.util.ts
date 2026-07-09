import { loadLlmReasoningBlockTags } from '../../llm/llm-reasoning-block-tags.util';

const MESSAGE_BLOCK_RE = /<message>([\s\S]*?)<\/message>/i;
const TOOL_CALLS_BLOCK_RE = /<tool_calls>[\s\S]*?<\/tool_calls>/gi;

type ReasoningStripPatterns = {
  thinkBlock: RegExp;
  thinkOpen: RegExp;
  thinkCloseTest: RegExp;
  thinkCloseAll: RegExp;
  unclosedThinkBlock: RegExp;
  orphanThinkTag: RegExp;
};

let cachedPatterns: ReasoningStripPatterns | null = null;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildReasoningStripPatterns(): ReasoningStripPatterns {
  const tags = loadLlmReasoningBlockTags().map(escapeRegExp);
  const tagAlt = tags.join('|');
  return {
    thinkBlock: new RegExp(
      `<(?:${tagAlt})(?:\\s[^>]*)?>[\\s\\S]*?</(?:${tagAlt})(?:\\s[^>]*)?>`,
      'gi',
    ),
    thinkOpen: new RegExp(`<(?:${tagAlt})(?:\\s[^>]*)?>`, 'i'),
    thinkCloseTest: new RegExp(`</(?:${tagAlt})(?:\\s[^>]*)?>`, 'i'),
    thinkCloseAll: new RegExp(`</(?:${tagAlt})(?:\\s[^>]*)?>`, 'gi'),
    unclosedThinkBlock: new RegExp(`<(?:${tagAlt})(?:\\s[^>]*)?>[\\s\\S]*`, 'gi'),
    orphanThinkTag: new RegExp(`<\\/?(?:${tagAlt})(?:\\s[^>]*)?>`, 'gi'),
  };
}

function getReasoningStripPatterns(): ReasoningStripPatterns {
  if (!cachedPatterns) {
    cachedPatterns = buildReasoningStripPatterns();
  }
  return cachedPatterns;
}

function tailAfterLastConfiguredThinkClose(
  text: string,
  patterns: ReasoningStripPatterns,
): string {
  let lastEnd = -1;
  for (const match of text.matchAll(patterns.thinkCloseAll)) {
    lastEnd = (match.index ?? 0) + match[0].length;
  }
  return lastEnd >= 0 ? text.slice(lastEnd).trim() : '';
}

/**
 * 模型无关兜底：取任意 XML 闭标签之后、或末段双换行之后的正文。
 */
function recoverUserFacingWhenStrippedEmpty(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const genericCloseTagRe = /<\/([a-zA-Z][\w-]*)\s*>/g;
  let lastGenericEnd = -1;
  for (const match of trimmed.matchAll(genericCloseTagRe)) {
    lastGenericEnd = (match.index ?? 0) + match[0].length;
  }
  if (lastGenericEnd >= 0) {
    const tail = trimmed.slice(lastGenericEnd).trim();
    if (tail.length >= 8 && !/^<[a-zA-Z]/.test(tail)) {
      return tail;
    }
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (paragraphs.length >= 2) {
    const last = paragraphs[paragraphs.length - 1];
    if (last.length >= 8) {
      return last;
    }
  }

  return '';
}

function recoverUserFacingTail(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const patterns = getReasoningStripPatterns();
  const afterKnownClose = tailAfterLastConfiguredThinkClose(trimmed, patterns);
  if (afterKnownClose.length >= 8 && !/^<[a-zA-Z]/.test(afterKnownClose)) {
    return afterKnownClose;
  }

  return recoverUserFacingWhenStrippedEmpty(raw);
}

function looksLikeInlineScaffolding(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  const patterns = getReasoningStripPatterns();
  return (
    patterns.thinkOpen.test(trimmed) ||
    patterns.thinkCloseTest.test(trimmed) ||
    /^<[a-zA-Z][\w-]*\s*>/.test(trimmed)
  );
}

/** 剥离模型输出中的思考块（含未闭合标签）。 */
export function stripLlmThinkBlocks(text: string): string {
  const patterns = getReasoningStripPatterns();
  let result = text.replace(patterns.thinkBlock, '');
  if (patterns.thinkOpen.test(result)) {
    result = result.replace(patterns.unclosedThinkBlock, '');
  }
  return result.replace(patterns.orphanThinkTag, '').trim();
}

function resolveUserFacingBody(
  source: string,
  options?: { stripToolCalls?: boolean },
): string {
  const raw = source.trim();
  if (!raw) {
    return '';
  }

  let body = stripLlmThinkBlocks(raw);
  const recovered = recoverUserFacingTail(raw);

  if (!body.trim()) {
    body = recovered;
  } else if (looksLikeInlineScaffolding(body) && recovered.length >= 8) {
    body = recovered;
  }

  if (options?.stripToolCalls !== false) {
    body = body.replace(TOOL_CALLS_BLOCK_RE, '').trim();
  }
  return body.trim();
}

/**
 * 模型原文 → 用户可见正文。
 * 标签族见 `llm-reasoning-block-tags.json`；新模型脚手架加配置即可，不改引擎逻辑。
 */
export function extractLlmUserFacingText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const messageMatch = MESSAGE_BLOCK_RE.exec(trimmed);
  if (messageMatch?.[1]) {
    return resolveUserFacingBody(messageMatch[1], { stripToolCalls: false });
  }
  return resolveUserFacingBody(trimmed);
}

/** 单段文本落库 / SSE 展示前净化。 */
export function sanitizeTextForStorage(text: string): string {
  return extractLlmUserFacingText(text);
}

/** 流式中间态或纯文本最终输出净化。 */
export function sanitizeLlmFinalOutput(value: string): string {
  return sanitizeTextForStorage(value);
}
