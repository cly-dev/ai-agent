import type { AIMessage } from '@langchain/core/messages';
import { extractLlmUserFacingText } from '../agent-engine/engine/llm-output-sanitize.util';

/** 仅取 content 通道，不把 reasoning_content 当作用户可见正文。 */
export function extractAiMessageContentChannel(
  message: Pick<AIMessage, 'content'>,
): string {
  const { content } = message;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((item) =>
        item && typeof item === 'object' && 'text' in item
          ? String((item as { text?: unknown }).text ?? '')
          : '',
      )
      .join('');
  }
  return '';
}

/**
 * AIMessage → 用户可见正文。
 * - 结构化字段：只用 content，reasoning 留在 additional_kwargs，不参与 summary。
 * - 内联脚手架：交给 extractLlmUserFacingText 做协议级剥离与安全兜底。
 */
export function resolveLlmUserFacingTextFromAiMessage(
  message: Pick<AIMessage, 'content'>,
): string {
  return extractLlmUserFacingText(extractAiMessageContentChannel(message));
}
