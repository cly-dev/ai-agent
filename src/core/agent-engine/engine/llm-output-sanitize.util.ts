const THINK_BLOCK_RE =
  /<think>[\s\S]*?<\/redacted_thinking>/gi;
const UNCLOSED_THINK_BLOCK_RE = /<think>[\s\S]*/gi;
const ORPHAN_THINK_TAG_RE = /<\/?redacted_thinking>/gi;
const MESSAGE_BLOCK_RE = /<message>([\s\S]*?)<\/message>/i;
const TOOL_CALLS_BLOCK_RE = /<tool_calls>[\s\S]*?<\/tool_calls>/gi;

/** 剥离模型输出中的思考块（含未闭合标签）。 */
export function stripLlmThinkBlocks(text: string): string {
  return text
    .replace(THINK_BLOCK_RE, '')
    .replace(UNCLOSED_THINK_BLOCK_RE, '')
    .replace(ORPHAN_THINK_TAG_RE, '')
    .trim();
}

/** 提取决策模型 <message> 内正文；无标签时剥离思考后返回剩余文本。 */
export function extractLlmUserFacingText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }
  const messageMatch = MESSAGE_BLOCK_RE.exec(trimmed);
  if (messageMatch?.[1]) {
    return stripLlmThinkBlocks(messageMatch[1]);
  }
  return stripLlmThinkBlocks(trimmed)
    .replace(TOOL_CALLS_BLOCK_RE, '')
    .trim();
}

/** 单段文本落库 / SSE 展示前净化。 */
export function sanitizeTextForStorage(text: string): string {
  return extractLlmUserFacingText(text);
}

/** 流式中间态或纯文本最终输出净化。 */
export function sanitizeLlmFinalOutput(value: string): string {
  return sanitizeTextForStorage(value);
}
