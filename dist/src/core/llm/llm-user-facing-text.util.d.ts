import type { AIMessage } from '@langchain/core/messages';
export declare function extractAiMessageContentChannel(message: Pick<AIMessage, 'content'>): string;
export declare function resolveLlmUserFacingTextFromAiMessage(message: Pick<AIMessage, 'content'>): string;
