import type { LlmChatMessage } from '../llm.types';
import type { PromptBlock } from './prompt-budget.types';
export declare function renderPromptBlocks(blocks: PromptBlock[]): LlmChatMessage[];
export declare function estimateBlocksTokens(blocks: PromptBlock[]): number;
export declare function pickNextDegradeCandidate(blocks: PromptBlock[]): PromptBlock | null;
export declare function nextDegradeLevel(current: import('./prompt-budget.types').DegradeLevel): import('./prompt-budget.types').DegradeLevel;
