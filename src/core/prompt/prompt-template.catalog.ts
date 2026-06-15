import {
  PROMPT_KEY_LIST,
  PROMPT_KEYS,
  type PromptTemplateKey,
} from './prompt-template.keys';

export type PromptTemplateCatalogItem = {
  key: PromptTemplateKey;
  category: string;
  title: string;
  description: string;
};

/** 允许在后台新建版本的 key（与代码注册表一致，不可随意扩展）。 */
export const PROMPT_TEMPLATE_CATALOG: readonly PromptTemplateCatalogItem[] = [
  {
    key: PROMPT_KEYS.PLATFORM_RESPONSE_STYLE,
    category: 'platform',
    title: '回答风格',
    description: '简洁 vs 详细输出规则',
  },
  {
    key: PROMPT_KEYS.AGENT_TOOL_DECISION,
    category: 'agent_runtime',
    title: '工具决策',
    description: '仅工具选择与参数规则，不含角色与结果生成',
  },
  {
    key: PROMPT_KEYS.AGENT_TASK_RESUME_FOLLOWUP,
    category: 'agent_runtime',
    title: '任务续跑追问判定',
    description: 'Plan 节点：判断用户是否在续接未完成 active task',
  },
  {
    key: PROMPT_KEYS.AGENT_READINESS_SLOT_CHECK,
    category: 'agent_runtime',
    title: '回合就绪槽位检查',
    description: 'readiness 节点：判断 gather 步 businessFields 是否可从用户消息或会话 obs 解析',
  },
  {
    key: PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION,
    category: 'agent_runtime',
    title: '槽位缺失反问',
    description: 'respond 节点：根据 missingFields 生成用户可见澄清话术（Message Blocks）',
  },
  {
    key: PROMPT_KEYS.AGENT_PLAN,
    category: 'agent_runtime',
    title: '任务 Plan 拆分',
    description: 'Plan 节点：拆 deliverable 与 steps（LLM structured output）',
  },
  {
    key: PROMPT_KEYS.AGENT_GATHER_PAGE_SUMMARY,
    category: 'agent_runtime',
    title: 'Gather 单页 Map 摘要',
    description: 'Plan analyze 路径：单页列表结构化摘要（无固定业务字段）',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL,
    category: 'agent_runtime',
    title: '工具结果摘要（详细）',
    description: '用户要求全量字段时',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_READ,
    category: 'agent_runtime',
    title: '工具结果摘要（查数）',
    description: 'READ_SUMMARY：结果与依据',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_ACTION,
    category: 'agent_runtime',
    title: '工具结果摘要（写操作）',
    description: 'ACTION_SUMMARY：成功/失败、操作内容与证据、风险与回滚建议',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME,
    category: 'agent_runtime',
    title: '写确认续跑摘要',
    description: '用户确认写操作后同步执行的结果汇报（成功条数/失败原因）',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_SMALLTALK,
    category: 'agent_runtime',
    title: '闲聊回复',
    description: 'smalltalk summarize',
  },
  {
    key: PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
    category: 'platform',
    title: 'Message Blocks 规范',
    description: '助手回复 blocks 类型与渲染规则',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS,
    category: 'agent_runtime',
    title: 'Summarize Message Blocks',
    description: 'summarize 节点结构化 blocks 输出',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_DRAFT_PROSE_SUPPLEMENT,
    category: 'agent_runtime',
    title: 'Plan 正文补轮',
    description: 'compose 缺 submit 正文或 present 需补用户可见文案时',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_PRESENT_FROM_COMPOSE,
    category: 'agent_runtime',
    title: 'Plan present 步展示',
    description: '基于 plan_compose_write 机器层 payload 生成用户可见 Markdown',
  },
  {
    key: PROMPT_KEYS.MEMORY_HISTORY_COMPRESSION,
    category: 'memory',
    title: '会话历史压缩',
    description: 'Redis 多轮摘要',
  },
  {
    key: PROMPT_KEYS.TOOLS_SCHEMA_INFERENCE,
    category: 'tools',
    title: '工具 Schema 推断',
    description: 'init-schemas LLM',
  },
] as const;

const ALLOWED_KEY_SET = new Set<string>(PROMPT_KEY_LIST);

export function isAllowedPromptTemplateKey(
  key: string,
): key is PromptTemplateKey {
  return ALLOWED_KEY_SET.has(key);
}

export function listCreatablePromptTemplateKeys(): PromptTemplateCatalogItem[] {
  return [...PROMPT_TEMPLATE_CATALOG];
}

export function getPromptTemplateCatalogItem(
  key: string,
): PromptTemplateCatalogItem | undefined {
  return PROMPT_TEMPLATE_CATALOG.find((item) => item.key === key);
}
