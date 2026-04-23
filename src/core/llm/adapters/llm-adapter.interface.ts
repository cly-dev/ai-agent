import type {
  LlmAdapterConfig,
  LlmChatRequest,
  LlmChatResult,
} from '../llm.types';

export const LLM_ADAPTER = 'LLM_ADAPTER';

export interface LlmAdapter {
  chat(request: LlmChatRequest, config: LlmAdapterConfig): Promise<LlmChatResult>;
}
