"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromptTemplateCatalogItem = exports.listCreatablePromptTemplateKeys = exports.isAllowedPromptTemplateKey = exports.PROMPT_TEMPLATE_CATALOG = void 0;
const prompt_template_keys_1 = require("./prompt-template.keys");
exports.PROMPT_TEMPLATE_CATALOG = [
    {
        key: prompt_template_keys_1.PROMPT_KEYS.PLATFORM_RESPONSE_STYLE,
        category: 'platform',
        title: '回答风格',
        description: '简洁 vs 详细输出规则',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_TOOL_DECISION,
        category: 'agent_runtime',
        title: '工具决策',
        description: '仅工具选择与参数规则，不含角色与结果生成',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_TASK_RESUME_FOLLOWUP,
        category: 'agent_runtime',
        title: '任务续跑追问判定',
        description: 'Plan 节点：判断用户是否在续接未完成 active task',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION,
        category: 'agent_runtime',
        title: '槽位缺失反问',
        description: 'respond 节点：根据 missingFields 生成用户可见澄清话术（Message Blocks）',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_RESPOND_SKILL_INTENT_MISMATCH,
        category: 'agent_runtime',
        title: 'Skill 意图不匹配澄清',
        description: 'summarize：预选 Skill 与用户写意图冲突时的友好说明（Message Blocks）',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_PLAN,
        category: 'agent_runtime',
        title: '任务 Plan 拆分',
        description: 'Plan 节点：拆 deliverable 与 steps（LLM structured output）',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_TURN_ROUTE,
        category: 'agent_runtime',
        title: 'Turn 任务路由',
        description: 'route_plan 节点：判断本轮 direct_answer / on_page_task / orchestrated_task',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_GATHER_PAGE_SUMMARY,
        category: 'agent_runtime',
        title: 'Gather 单页 Map 摘要',
        description: 'Plan analyze 路径：单页列表结构化摘要（无固定业务字段）',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_TOOL_FULL,
        category: 'agent_runtime',
        title: '工具结果摘要（详细）',
        description: '用户要求全量字段时',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_READ,
        category: 'agent_runtime',
        title: '工具结果摘要（查数）',
        description: 'READ_SUMMARY：结果与依据',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_ACTION,
        category: 'agent_runtime',
        title: '工具结果摘要（写操作）',
        description: 'ACTION_SUMMARY：成功/失败、操作内容与证据、风险与回滚建议',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME,
        category: 'agent_runtime',
        title: '写确认续跑摘要',
        description: '用户确认写操作后同步执行的结果汇报（成功条数/失败原因）',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.PLATFORM_MESSAGE_BLOCKS_SPEC,
        category: 'platform',
        title: 'Message Blocks 规范',
        description: '助手回复 blocks 类型与渲染规则',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_MESSAGE_BLOCKS,
        category: 'agent_runtime',
        title: 'Summarize Message Blocks',
        description: '流式 Markdown 正文 + 可选 blocks；含写预览、读结果与 table 防重复规则',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_DRAFT_PROSE_SUPPLEMENT,
        category: 'agent_runtime',
        title: 'Plan 正文补轮',
        description: 'compose 缺 submit 正文或 present 需补用户可见文案时',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_PRESENT_FROM_COMPOSE,
        category: 'agent_runtime',
        title: 'Plan present 步展示',
        description: '基于 plan_compose_write 机器层 payload 生成用户可见 Markdown',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.AGENT_SUMMARIZE_PLAN_REASON_HOST_FILL_STREAM,
        category: 'agent_runtime',
        title: 'Plan reason Host Fill 流式机器层',
        description: 'reason→host_tool：plain text 流式产出，经 DSL arg.append 填入宿主表单',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.MEMORY_HISTORY_COMPRESSION,
        category: 'memory',
        title: '会话历史压缩',
        description: 'Redis 多轮摘要',
    },
    {
        key: prompt_template_keys_1.PROMPT_KEYS.TOOLS_SCHEMA_INFERENCE,
        category: 'tools',
        title: '工具 Schema 推断',
        description: 'init-schemas LLM',
    },
];
const ALLOWED_KEY_SET = new Set(prompt_template_keys_1.PROMPT_KEY_LIST);
function isAllowedPromptTemplateKey(key) {
    return ALLOWED_KEY_SET.has(key);
}
exports.isAllowedPromptTemplateKey = isAllowedPromptTemplateKey;
function listCreatablePromptTemplateKeys() {
    return [...exports.PROMPT_TEMPLATE_CATALOG];
}
exports.listCreatablePromptTemplateKeys = listCreatablePromptTemplateKeys;
function getPromptTemplateCatalogItem(key) {
    return exports.PROMPT_TEMPLATE_CATALOG.find((item) => item.key === key);
}
exports.getPromptTemplateCatalogItem = getPromptTemplateCatalogItem;
//# sourceMappingURL=prompt-template.catalog.js.map