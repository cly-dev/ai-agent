/** 提示词 key 常量（DB PromptTemplate.key）。 */

export const PROMPT_KEYS = {
  PLATFORM_RESPONSE_STYLE: 'platform.response_style',
  /** 工具决策专用（无角色/无结果生成规则） */
  AGENT_TOOL_DECISION: 'agent.tool_decision',
  /** 未完成会话任务：判断用户是否在续接 active task（Plan 续跑门控） */
  AGENT_TASK_RESUME_FOLLOWUP: 'agent.task_resume_followup',
  AGENT_PLAN: 'agent.plan',
  /** gather 分页：单页列表 LLM map 摘要（通用业务字段） */
  AGENT_GATHER_PAGE_SUMMARY: 'agent.gather_page_summary',
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
  /** 写确认续跑后 summarize：汇报已确认写操作的成功/失败与条数 */
  AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME: 'agent.summarize_write_confirm_resume',
  MEMORY_HISTORY_COMPRESSION: 'memory.history_compression',
  TOOLS_SCHEMA_INFERENCE: 'tools.schema_inference',
} as const;

export type PromptTemplateKey =
  (typeof PROMPT_KEYS)[keyof typeof PROMPT_KEYS];

export const PROMPT_KEY_LIST: PromptTemplateKey[] = Object.values(PROMPT_KEYS);
