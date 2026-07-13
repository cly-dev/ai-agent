import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock } from './prompt-budget.types';
export declare function parsePromptBlocks(messages: LlmChatMessage[]): PromptBlock[];
export declare function resetPromptBlockIdCounterForTests(): void;
