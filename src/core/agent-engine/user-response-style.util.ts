/** 识别用户是否要「全量 / 详细」回答（影响 summarize 与输出格式）。 */

const FULL_DETAIL_HINTS = [
  '全部',
  '全量',
  '完整',
  '详细',
  '详情',
  '所有字段',
  '全部字段',
  '每一项',
  '不要省略',
  '别省略',
  '信息要全',
  '尽量全',
  'full detail',
  'all fields',
  'complete info',
];

export function isUserRequestingFullDetail(userMessage: string): boolean {
  const text = userMessage.trim().toLowerCase();
  if (!text) {
    return false;
  }
  return FULL_DETAIL_HINTS.some((hint) => text.includes(hint.toLowerCase()));
}

