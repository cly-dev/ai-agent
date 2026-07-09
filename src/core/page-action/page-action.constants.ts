export const PAGE_ACTION_STREAM_REASON = 'page_action_host_fill' as const;
export const PAGE_ACTION_SUMMARIZE_STREAM_REASON = 'page_action_summarize' as const;

export const PAGE_ACTION_PROMPT_LIMITS = {
  systemPromptMax: 8_192,
  instructionMax: 32_768,
  contextJsonMax: 65_536,
} as const;

export function buildPageActionStreamId(input: {
  actionRunId: number;
  actionKey: string;
  /** host_action DSL 会话分段（如 workflow nodeId），避免同 run 多节点复用 streamId */
  segment?: string | null;
}): string {
  const slug = input.actionKey.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 48);
  const base = `pa-${input.actionRunId}-${slug}`;
  const segment = input.segment?.trim();
  if (!segment) {
    return base;
  }
  const segmentSlug = segment.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 32);
  return `${base}-${segmentSlug}`;
}

/** C 端按 run 订阅 SSE 的相对路径（invoke.streamUrl / 任务详情.streamUrl）。 */
export function buildPageActionRunStreamPath(runId: number): string {
  return `/page-action/runs/${runId}/stream`;
}
