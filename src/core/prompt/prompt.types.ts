import type { LlmChatMessage } from '../llm/llm.types';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';

export type PromptComposeInput = {
  userId: number;
  sessionId: string;
  latestUserMessage: string;
  /** When provided, skips Agent DB lookup for systemPrompt. */
  agentSystemPrompt?: string | null;
  /** When provided, skips Session DB lookup for prompt template scope. */
  sessionScope?: {
    appClientId: number | null;
    agentId: number | null;
  };
  /** 宿主页面上下文，注入 `<page_context>` system 段。 */
  pageContext?: AgentChatPageContext | null;
};

export type PromptComposeOutput = {
  messages: LlmChatMessage[];
};
