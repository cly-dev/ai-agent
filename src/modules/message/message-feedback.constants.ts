/** C 端点踩原因标签（key 入库；label 供前端展示）。 */
export const MESSAGE_FEEDBACK_DOWN_REASON_TAGS = [
  { key: 'factual_error', label: '事实错误或胡编' },
  { key: 'misunderstood', label: '没理解我的需求' },
  { key: 'incomplete', label: '回答不完整' },
  { key: 'wrong_tool', label: '工具或数据用错了' },
  { key: 'format_bad', label: '格式难读或展示有问题' },
  { key: 'other', label: '其他' },
] as const;

export type MessageFeedbackDownReasonTagKey =
  (typeof MESSAGE_FEEDBACK_DOWN_REASON_TAGS)[number]['key'];

const ALLOWED_DOWN_REASON_TAG_KEYS = new Set<string>(
  MESSAGE_FEEDBACK_DOWN_REASON_TAGS.map((row) => row.key),
);

export function isAllowedDownReasonTagKey(key: string): boolean {
  return ALLOWED_DOWN_REASON_TAG_KEYS.has(key);
}

export function normalizeDownReasonTags(
  tags: string[] | undefined | null,
): string[] {
  if (!tags?.length) {
    return [];
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of tags) {
    const key = raw.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(key);
  }
  return normalized;
}
