import type { CallKindPolicy, PromptBlockKind, PromptBudgetCallKind } from './prompt-budget.types';

const SKIP_FIT_KINDS = new Set<PromptBudgetCallKind>([
  'compression',
  'gather_page_summary',
  'schema_inference',
]);

export function resolveCallKindPolicy(
  callKind: PromptBudgetCallKind | undefined,
  skipFit?: boolean,
): CallKindPolicy {
  if (skipFit) {
    return { skipFit: true };
  }
  const kind = callKind ?? 'default';
  if (SKIP_FIT_KINDS.has(kind)) {
    return { skipFit: true };
  }

  switch (kind) {
    case 'decision':
      return {
        maxDegradeLevelByKind: {
          // 无标签 system 走 other；L2 清空会丢掉产参规则，decision 禁止删光
          other: 1,
          agent_prompt: 1,
          current_user_request: 0,
          invoke_context: 2,
          session_history_turns: 2,
          current_run_observations: 2,
          tool_schema: 2,
          host_tool_schema: 2,
        },
      };
    case 'summarize':
      return {
        maxDegradeLevelByKind: {
          current_user_request: 0,
          plan_context: 1,
          pending_write_tool_call: 0,
          current_run_observations: 2,
          summarize_context: 2,
          tool_schema: 2,
          host_tool_schema: 2,
          tool_decision: 4,
        },
      };
    case 'plan':
      return {
        maxDegradeLevelByKind: {
          session_goa: 1,
          tool_schema: 4,
          host_tool_schema: 4,
        },
      };
    case 'routing':
      return {
        maxDegradeLevelByKind: {
          working_memory_observations: 4,
          current_run_observations: 4,
          session_goa: 3,
          tool_schema: 4,
        },
      };
    default:
      return {};
  }
}

export function applyCallKindPolicyToBlock(
  kind: PromptBlockKind,
  baseMaxDegrade: import('./prompt-budget.types').DegradeLevel,
  policy: CallKindPolicy,
): import('./prompt-budget.types').DegradeLevel {
  const cap = policy.maxDegradeLevelByKind?.[kind];
  if (cap == null) {
    return baseMaxDegrade;
  }
  return Math.min(baseMaxDegrade, cap) as import('./prompt-budget.types').DegradeLevel;
}
