import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock, PromptBudgetCallKind } from './prompt-budget.types';
export type ParsePromptBlocksOptions = {
    callKind?: PromptBudgetCallKind;
};
export declare function shouldParseAsCompositeMessage(content: string, callKind?: PromptBudgetCallKind): boolean;
export declare function parsePromptBlocks(messages: LlmChatMessage[], options?: ParsePromptBlocksOptions): PromptBlock[];
export declare function resetPromptBlockIdCounterForTests(): void;
