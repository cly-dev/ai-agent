import type { PromptTemplateKey } from '../../../../prompt/prompt-template.keys';

/**
 * summarize LLM 交付：统一 prose 流式（SSE delta + 定稿 full）。
 * 结构化 table/chart/metric 仍由服务端 ruleBlocks + patch 注入。
 */
export type SummarizeLlmDelivery = 'prose_stream';

export function resolveSummarizeLlmDelivery(
  _promptKey: PromptTemplateKey,
): SummarizeLlmDelivery {
  return 'prose_stream';
}
