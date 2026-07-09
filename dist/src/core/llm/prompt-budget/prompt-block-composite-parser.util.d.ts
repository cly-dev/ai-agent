import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock } from './prompt-budget.types';
export declare function isCompositeSummarizeUserMessage(content: string): boolean;
export declare function parseCompositeUserMessage(message: LlmChatMessage, messageIndex: number): PromptBlock[];
export declare function resetCompositeBlockIdCounterForTests(): void;
