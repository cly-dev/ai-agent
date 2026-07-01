import type { DegradeLevel, PromptBlock } from './prompt-budget.types';
export declare function applyDegradeToBlock(block: PromptBlock, level: DegradeLevel): PromptBlock;
export declare function mergeSessionHistoryTurnBlocks(blocks: PromptBlock[]): PromptBlock[];
