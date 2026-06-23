import { PROMPT_KEYS, type PromptTemplateKey } from '../../../../prompt/prompt-template.keys';

/**
 * summarize LLM 交付模式（互斥，不可在同一流里混用）：
 * - prose_stream：SSE 只推 Markdown 正文；blocks 由服务端 ruleBlocks + textBlock 组装
 * - blocks_invoke：非流式整段 JSON；解析为 MessageBlock[] 后一次性 publish（不向用户推 JSON token）
 */
export type SummarizeLlmDelivery = 'prose_stream' | 'blocks_invoke';

const BLOCKS_INVOKE_PROMPT_KEYS = new Set<PromptTemplateKey>([
  PROMPT_KEYS.AGENT_SUMMARIZE_READ,
  PROMPT_KEYS.AGENT_SUMMARIZE_ACTION,
  PROMPT_KEYS.AGENT_SUMMARIZE_WRITE_CONFIRM_RESUME,
  PROMPT_KEYS.AGENT_RESPOND_CLARIFICATION,
]);

export function resolveSummarizeLlmDelivery(
  promptKey: PromptTemplateKey,
): SummarizeLlmDelivery {
  return BLOCKS_INVOKE_PROMPT_KEYS.has(promptKey)
    ? 'blocks_invoke'
    : 'prose_stream';
}
