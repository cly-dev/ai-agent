import type { AgentChatPageContext } from './page-context.types';
import { parsePageContextFromMessageFields } from './parse-page-context.util';

/** 供 Prompt 注入的 `<page_context>` 段；无效对象返回 null。 */
export function formatPageContextPromptBlock(
  pageContext: AgentChatPageContext | null | undefined,
): string | null {
  const normalized = pageContext
    ? parsePageContextFromMessageFields({ pageContext })
    : null;
  if (!normalized) {
    return null;
  }
  return `<page_context>\n${JSON.stringify(normalized)}\n</page_context>`;
}
