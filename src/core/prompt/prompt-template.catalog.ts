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
    key: PROMPT_KEYS.AGENT_DECISION_LOOP,
    category: 'agent_runtime',
    title: '主循环决策（旧）',
    description: '已弃用，请改用 agent.tool_decision',
  },
  {
    key: PROMPT_KEYS.AGENT_TOOL_DECISION,
    category: 'agent_runtime',
    title: '工具决策',
    description: '仅工具选择与参数规则，不含角色与结果生成',
  },
  {
    key: PROMPT_KEYS.AGENT_PRECHECK_HISTORY_ANSWERABLE,
    category: 'agent_runtime',
    title: '预检查历史可答',
    description: '判断是否可直接基于历史 observation 回答',
  },
  {
    key: PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_BRIEF,
    category: 'agent_runtime',
    title: '工具结果摘要（简洁）',
    description: 'summarize 节点默认模式',
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
    description: 'ACTION_SUMMARY：结果、风险与回滚建议',
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
    key: PROMPT_KEYS.MEMORY_HISTORY_COMPRESSION,
    category: 'memory',
    title: '会话历史压缩',
    description: 'Redis 多轮摘要',
  },
  {
    key: PROMPT_KEYS.MEMORY_WORKING_MEMORY_REFRESH,
    category: 'memory',
    title: '工作记忆刷新',
    description: '每轮结束后 WM JSON',
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
