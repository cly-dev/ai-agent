import type { LlmChatMessage } from '../llm.types';
import type { FitMessagesResult, PromptBudgetHints } from './prompt-budget.types';
export declare function fitPromptToBudget(messages: LlmChatMessage[], budget: number, hints?: PromptBudgetHints): FitMessagesResult;
