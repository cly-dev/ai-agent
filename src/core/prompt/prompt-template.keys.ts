/** 提示词 key 常量（DB PromptTemplate.key）。 */

export const PROMPT_KEYS = {
  PLATFORM_RESPONSE_STYLE: 'platform.response_style',
  PLATFORM_INTEGRATION_SITE: 'platform.integration_site',
  AGENT_DECISION_LOOP: 'agent.decision_loop',
  AGENT_SUMMARIZE_TOOL_BRIEF: 'agent.summarize_tool_brief',
  AGENT_SUMMARIZE_TOOL_FULL: 'agent.summarize_tool_full',
  AGENT_SUMMARIZE_SMALLTALK: 'agent.summarize_smalltalk',
  MEMORY_HISTORY_COMPRESSION: 'memory.history_compression',
  MEMORY_WORKING_MEMORY_REFRESH: 'memory.working_memory_refresh',
  TOOLS_SCHEMA_INFERENCE: 'tools.schema_inference',
} as const;

export type PromptTemplateKey =
  (typeof PROMPT_KEYS)[keyof typeof PROMPT_KEYS];

export const PROMPT_KEY_LIST: PromptTemplateKey[] = Object.values(PROMPT_KEYS);
