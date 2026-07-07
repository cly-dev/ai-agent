export const PAGE_ACTION_STREAM_REASON = 'page_action_host_fill' as const;

export const PAGE_ACTION_PROMPT_LIMITS = {
  systemPromptMax: 8_192,
  instructionMax: 32_768,
  contextJsonMax: 65_536,
} as const;

export function buildPageActionStreamId(input: {
  actionRunId: number;
  actionKey: string;
}): string {
  const slug = input.actionKey.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 48);
  return `pa-${input.actionRunId}-${slug}`;
}

/** C 端按 run 订阅 SSE 的相对路径（invoke.streamUrl / 任务详情.streamUrl）。 */
export function buildPageActionRunStreamPath(runId: number): string {
  return `/page-action/runs/${runId}/stream`;
}
