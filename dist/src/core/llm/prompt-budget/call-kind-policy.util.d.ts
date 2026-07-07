import type { CallKindPolicy, PromptBlockKind, PromptBudgetCallKind } from './prompt-budget.types';
export declare function resolveCallKindPolicy(callKind: PromptBudgetCallKind | undefined, skipFit?: boolean): CallKindPolicy;
export declare function applyCallKindPolicyToBlock(kind: PromptBlockKind, baseMaxDegrade: import('./prompt-budget.types').DegradeLevel, policy: CallKindPolicy): import('./prompt-budget.types').DegradeLevel;
