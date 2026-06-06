/** 与 agent-engine intent scope 缓存键中的问句归一化保持一致。 */
export function normalizeUserMessageKey(userMessage: string): string {
  return userMessage.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** 向量召回前的轻量规则：过短或无可读字符视为意图不明确。 */
export function isUserIntentClear(userMessage: string): boolean {
  const trimmed = userMessage.trim();
  if (trimmed.length < 2) {
    return false;
  }
  return /[\p{L}\p{N}]/u.test(trimmed);
}

export function buildIntentClarificationGuidance(userMessage: string): string {
  const trimmed = userMessage.trim();
  if (trimmed.length === 0) {
    return '请先描述你的问题或希望完成的操作。';
  }
  return '你的描述还不够明确，请说明具体场景、对象或你希望完成的操作，我再继续处理。';
}

/** 类目意图未命中时，summarize 节点的引导语（系统当前不支持该问题域）。 */
export function buildUnsupportedIntentGuidance(): string {
  return '当前问题未匹配到系统支持的工具能力范围，暂无法处理该请求。你可以换个与已接入业务相关的问题试试。';
}
