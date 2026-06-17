import type { AgentChatPageContext } from './page-context.types';
import { parsePageContextFromMessageFields } from './parse-page-context.util';

function normalizePageContext(
  source: AgentChatPageContext | null | undefined,
): AgentChatPageContext | null {
  if (!source) {
    return null;
  }
  return parsePageContextFromMessageFields({ pageContext: source });
}

/** 按优先级合并多个 pageContext 来源（前者优先）；忽略空对象。 */
export function coalescePageContext(
  ...sources: Array<AgentChatPageContext | null | undefined>
): AgentChatPageContext | null {
  for (const source of sources) {
    const normalized = normalizePageContext(source);
    if (normalized) {
      return normalized;
    }
  }
  return null;
}

/** 入站 pageContext 优先；追问未带时回落会话最近一次。 */
export function resolveEffectivePageContext(
  incoming: AgentChatPageContext | null | undefined,
  stored: AgentChatPageContext | null | undefined,
): AgentChatPageContext | null {
  return coalescePageContext(incoming, stored);
}
