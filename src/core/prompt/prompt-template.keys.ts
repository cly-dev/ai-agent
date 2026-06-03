/** 提示词 key 常量（DB PromptTemplate.key）。 */

export const PROMPT_KEYS = {
  PLATFORM_RESPONSE_STYLE: 'platform.response_style',
  AGENT_DECISION_LOOP: 'agent.decision_loop',
  /** 工具决策专用（无角色/无结果生成规则） */
  AGENT_TOOL_DECISION: 'agent.tool_decision',
  AGENT_PRECHECK_HISTORY_ANSWERABLE: 'agent.precheck_history_answerable',
  AGENT_SUMMARIZE_TOOL_BRIEF: 'agent.summarize_tool_brief',
  AGENT_SUMMARIZE_TOOL_FULL: 'agent.summarize_tool_full',
  /** 查数 / 只读：结果 + 依据 */
  AGENT_SUMMARIZE_READ: 'agent.summarize_read',
  /** 写操作：执行结果 + 风险 + 回滚建议 */
  AGENT_SUMMARIZE_ACTION: 'agent.summarize_action',
  AGENT_SUMMARIZE_SMALLTALK: 'agent.summarize_smalltalk',
  /** Message Blocks 类型与字段规范（全局） */
  PLATFORM_MESSAGE_BLOCKS_SPEC: 'platform.message_blocks_spec',
  /** summarize 节点：按 blocks 协议输出 */
  AGENT_SUMMARIZE_MESSAGE_BLOCKS: 'agent.summarize_message_blocks',
  MEMORY_HISTORY_COMPRESSION: 'memory.history_compression',
  MEMORY_WORKING_MEMORY_REFRESH: 'memory.working_memory_refresh',
  TOOLS_SCHEMA_INFERENCE: 'tools.schema_inference',
} as const;

export type PromptTemplateKey =
  (typeof PROMPT_KEYS)[keyof typeof PROMPT_KEYS];

export const PROMPT_KEY_LIST: PromptTemplateKey[] = Object.values(PROMPT_KEYS);
