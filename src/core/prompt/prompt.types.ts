import type { LlmChatMessage } from '../llm/llm.types';

export type PromptComposeInput = {
  userId: number;
  sessionId: string;
  latestUserMessage: string;
};

export type PromptComposeOutput = {
  messages: LlmChatMessage[];
};
