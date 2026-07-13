import type { LlmChatMessage } from './llm.types';
export declare function estimateTextTokens(text: string): number;
export declare function estimateMessageTokens(message: LlmChatMessage): number;
export declare function estimateMessagesTokens(messages: LlmChatMessage[]): number;
export type TrimMessagesResult = {
    messages: LlmChatMessage[];
    estimatedTokensBefore: number;
    estimatedTokensAfter: number;
    trimmed: boolean;
    droppedMessageIndexes: number[];
    truncatedMessageIndexes: number[];
};
export declare function trimMessagesToTokenBudgetDetailed(messages: LlmChatMessage[], maxTokens: number): TrimMessagesResult;
export declare function trimMessagesToTokenBudget(messages: LlmChatMessage[], maxTokens: number): LlmChatMessage[];
