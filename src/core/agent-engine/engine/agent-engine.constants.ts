function readPositiveInt(envKey: string, defaultValue: number): number {
  const raw = process.env[envKey];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}

/** 工具结果 summarize（streamSummarizerResult）输出 token 上限，默认 2048。 */
export function getAgentSummarizeToolMaxTokens(): number {
  return readPositiveInt('AGENT_SUMMARIZE_TOOL_MAX_TOKENS', 2048);
}

/** 闲聊 summarize 输出 token 上限，默认 256。 */
export function getAgentSummarizeSmallTalkMaxTokens(): number {
  return readPositiveInt('AGENT_SUMMARIZE_SMALLTALK_MAX_TOKENS', 256);
}

/** 用户要求「详细/全量」时的 summarize 输出 token 上限，默认 4096。 */
export function getAgentSummarizeToolDetailMaxTokens(): number {
  return readPositiveInt('AGENT_SUMMARIZE_TOOL_DETAIL_MAX_TOKENS', 4096);
}

/** 详情类问题跳过 LLM summarize、直接 Markdown 格式化的结果长度上限。 */
export function getAgentDetailReplySkipSummarizeMaxChars(): number {
  return readPositiveInt('AGENT_DETAIL_REPLY_SKIP_SUMMARIZE_MAX_CHARS', 12_000);
}
