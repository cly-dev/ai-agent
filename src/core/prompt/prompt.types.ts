import type { LlmChatMessage } from '../llm/llm.types';

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
};

export type PromptComposeOutput = {
  messages: LlmChatMessage[];
};
