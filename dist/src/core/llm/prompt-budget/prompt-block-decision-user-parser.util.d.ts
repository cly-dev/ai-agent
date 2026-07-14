import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock } from './prompt-budget.types';
export declare function shouldParseAsDecisionInvokeUserMessage(message: LlmChatMessage, callKind?: import('./prompt-budget.types').PromptBudgetCallKind): boolean;
export declare function parseDecisionInvokeUserMessage(message: LlmChatMessage, messageIndex: number): PromptBlock[];
export declare function resetDecisionUserBlockIdCounterForTests(): void;
