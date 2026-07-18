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
 * 仅在「剥离 thinking 后正文为空」时使用。
 * 优先取配置过的 thinking 闭标签之后；再兜底末段双换行。
 * 不做「任意 HTML/XML 开标签 → 裁成末段」——那会误伤博客 HTML prose。
 */
function recoverWhenThinkStripEmptied(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  const patterns = getReasoningStripPatterns();
  const afterThinkClose = tailAfterLastConfiguredThinkClose(trimmed, patterns);
  if (afterThinkClose.length > 0) {
    return afterThinkClose;
  }

  // thinking 未闭合、整段被 strip 吃掉：无可靠正文边界，返回空，避免误取 HTML 末段。
  if (patterns.thinkOpen.test(trimmed)) {
    return '';
  }

  return '';
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

/**
 * 真源契约：
 * 1. 有正文 → 只剥 thinking，保留全文（含合法 HTML `<h1>`/`<p>`）
 * 2. 剥完为空 → 仅从 thinking 闭标签之后恢复
 * 禁止：因「看起来像标签」就用末段覆盖非空正文（那是补丁式启发式，会裁掉博客全文）
 */
function resolveUserFacingBody(
  source: string,
  options?: { stripToolCalls?: boolean },
): string {
  const raw = source.trim();
  if (!raw) {
    return '';
  }

  let body = stripLlmThinkBlocks(raw);
  if (!body.trim()) {
    body = recoverWhenThinkStripEmptied(raw);
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
