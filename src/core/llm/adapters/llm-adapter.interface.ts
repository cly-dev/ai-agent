import type {
  LlmAdapterConfig,
  LlmChatRequest,
  LlmChatResult,
  LlmStreamHandlers,
} from '../llm.types';

export const LLM_ADAPTER = 'LLM_ADAPTER';

export interface LlmAdapter {
  chat(request: LlmChatRequest, config: LlmAdapterConfig): Promise<LlmChatResult>;
  streamChat(
    request: LlmChatRequest,
    config: LlmAdapterConfig,
    handlers?: LlmStreamHandlers,
  ): Promise<LlmChatResult>;
}
