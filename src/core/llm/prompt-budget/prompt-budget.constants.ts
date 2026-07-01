import type { PromptBlockKind, DegradeLevel } from './prompt-budget.types';

function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey]?.trim();
  if (!raw) {
    return defaultValue;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function readRatio(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey]?.trim();
  if (!raw) {
    return defaultValue;
  }
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed < 1
    ? parsed
    : defaultValue;
}

function readBool(envKey: string, defaultEnabled: boolean): boolean {
  const raw = process.env[envKey]?.trim().toLowerCase();
  if (!raw) {
    return defaultEnabled;
  }
  if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') {
    return false;
  }
  return true;
}

export function isPromptBudgetEnabled(): boolean {
  return readBool('PROMPT_BUDGET_ENABLED', true);
}

export function getPromptBudgetSafetyMarginRatio(): number {
  return readRatio('PROMPT_BUDGET_SAFETY_MARGIN_RATIO', 0.08);
}

export function getPromptBudgetReserveTokens(): number {
  return readPositiveInt('PROMPT_BUDGET_RESERVE_TOKENS', 384);
}

export function getPromptObsMaxRecordsL1(): number {
  return readPositiveInt('PROMPT_OBS_MAX_RECORDS_L1', 20);
}

export function getPromptObsFieldPreviewChars(): number {
  return readPositiveInt('PROMPT_OBS_FIELD_PREVIEW_CHARS', 500);
}

export function getPromptObsLongFieldThreshold(): number {
  return readPositiveInt('PROMPT_OBS_LONG_FIELD_THRESHOLD', 800);
}

export function getPromptSkillExcerptChars(): number {
  return readPositiveInt('PROMPT_SKILL_EXCERPT_CHARS', 1200);
}

export function getPromptAgentExcerptChars(): number {
  return readPositiveInt('PROMPT_AGENT_EXCERPT_CHARS', 800);
}

export function getPromptAgentExcerptCharsL2(): number {
  return readPositiveInt('PROMPT_AGENT_EXCERPT_CHARS_L2', 400);
}

export function getPromptGoaMaxEpisodesL1(): number {
  return readPositiveInt('PROMPT_GOA_MAX_EPISODES_L1', 3);
}

export function getPromptHistoryMaxTurnsL0(): number {
  return readPositiveInt('PROMPT_HISTORY_MAX_TURNS_L0', 12);
}

export const PROMPT_BUDGET_NOTE_TAG = 'prompt_budget_note';

export const BLOCK_PRIORITY: Record<PromptBlockKind, number> = {
  current_user_request: 0,
  plan_step_override: 0,
  plan_context: 5,
  tool_decision: 10,
  tool_schema: 10,
  host_tool_schema: 10,
  pending_write_tool_call: 9,
  current_run_observations: 20,
  summarize_context: 18,
  page_context: 25,
  working_memory_observations: 30,
  session_goa: 35,
  session_history_summary: 40,
  session_history_guide: 41,
  session_history_turns: 40,
  user_memory: 40,
  tool_result_legacy: 45,
  other: 45,
  agent_prompt: 50,
  response_style: 55,
  message_blocks_spec: 55,
};

export const BLOCK_MAX_DEGRADE: Record<PromptBlockKind, DegradeLevel> = {
  current_user_request: 0,
  plan_step_override: 0,
  plan_context: 1,
  tool_decision: 2,
  tool_schema: 2,
  host_tool_schema: 2,
  pending_write_tool_call: 1,
  current_run_observations: 3,
  page_context: 2,
  working_memory_observations: 4,
  session_goa: 3,
  session_history_summary: 2,
  session_history_guide: 1,
  session_history_turns: 3,
  summarize_context: 2,
  user_memory: 2,
  tool_result_legacy: 2,
  other: 2,
  agent_prompt: 2,
  response_style: 2,
  message_blocks_spec: 1,
};

export const SESSION_GOA_TAG_SECTION: Record<string, import('./prompt-budget.types').SessionGoaSection> =
  {
    session_goa_coverage: 'coverage',
    recent_episodes: 'episodes',
    artifact_summaries: 'artifacts',
    observation_inventory: 'inventory',
    active_task: 'active_task',
    session_entities: 'entities',
  };
