import type { LlmAdapter } from './llm-adapter.interface';
import type { LlmAdapterConfig, LlmChatRequest, LlmChatResult, LlmStreamHandlers } from '../llm.types';
export declare class OpenAiCompatibleAdapter implements LlmAdapter {
    private readonly logger;
    private streamReasoningOnlyChunks;
    private streamEmptyContentChunks;
    private streamContentChunks;
    chat(request: LlmChatRequest, config: LlmAdapterConfig): Promise<LlmChatResult>;
    streamChat(request: LlmChatRequest, config: LlmAdapterConfig, handlers?: LlmStreamHandlers): Promise<LlmChatResult>;
    private resolveEndpoint;
    private resetStreamProbe;
    private logStreamProbeSummary;
    private extractContent;
    private extractReasoning;
    private noteStreamChunk;
    private extractToolCalls;
    private extractMessage;
    private buildPayload;
    private tryParseChunk;
    private normalizeArguments;
}
