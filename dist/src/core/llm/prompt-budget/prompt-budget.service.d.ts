import type { LlmChatMessage } from '../llm.types';
import type { FitMessagesResult, PromptBudgetHints } from './prompt-budget.types';
export declare class PromptBudgetService {
    private readonly logger;
    fitMessages(messages: LlmChatMessage[], budget: number, hints?: PromptBudgetHints): FitMessagesResult;
}
export { fitPromptToBudget } from './fit-prompt-to-budget.util';
