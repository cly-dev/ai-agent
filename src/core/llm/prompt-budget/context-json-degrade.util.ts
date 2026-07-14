import { excerptText } from './text-degrade.util';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 递归截断 JSON 中的长 string；array / object 结构保留（含 id↔title 对照表）。
 * 不按业务字段名分支，只按类型处理。
 */
export function truncateJsonStringFields(
  value: unknown,
  maxStringChars: number,
): unknown {
  if (typeof value === 'string') {
    if (value.length <= maxStringChars) {
      return value;
    }
    return excerptText(value, maxStringChars);
  }
  if (Array.isArray(value)) {
    return value.map((item) => truncateJsonStringFields(item, maxStringChars));
  }
  if (isRecord(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = truncateJsonStringFields(nested, maxStringChars);
    }
    return out;
  }
  return value;
}

const CONTEXT_OPEN = '<context>';
const CONTEXT_CLOSE = '</context>';

function maxStringCharsForLevel(level: 1 | 2 | 3): number {
  if (level === 1) {
    return 2_500;
  }
  if (level === 2) {
    return 1_200;
  }
  return 400;
}

/**
 * 对含 `<context>{json}</context>` 的文本做结构化降级：截长 string，保留 array/object。
 * 无合法 context 块时退回整段 excerpt。
 */
export function degradeTaggedContextJsonMessage(
  text: string,
  level: 1 | 2 | 3,
): string {
  const openIdx = text.indexOf(CONTEXT_OPEN);
  const closeIdx = text.indexOf(CONTEXT_CLOSE);
  if (openIdx < 0 || closeIdx <= openIdx) {
    return excerptText(
      text,
      level === 1 ? 3_000 : level === 2 ? 1_500 : 800,
    );
  }
  const innerStart = openIdx + CONTEXT_OPEN.length;
  const rawJson = text.slice(innerStart, closeIdx).trim();
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    const truncated = truncateJsonStringFields(
      parsed,
      maxStringCharsForLevel(level),
    );
    const nextContext = `${CONTEXT_OPEN}\n${JSON.stringify(truncated)}\n${CONTEXT_CLOSE}`;
    const rebuilt =
      text.slice(0, openIdx) + nextContext + text.slice(closeIdx + CONTEXT_CLOSE.length);
    // 前缀（User request / page_context）通常较短；整段仍极大时再兜一层
    if (rebuilt.length > 12_000 && level >= 2) {
      return excerptText(rebuilt, 10_000);
    }
    return rebuilt.trim();
  } catch {
    return excerptText(
      text,
      level === 1 ? 3_000 : level === 2 ? 1_500 : 800,
    );
  }
}

/** invoke_context 块 payload：整段即 `<context>...</context>`。 */
export function degradeInvokeContextBlockText(
  text: string,
  level: 1 | 2 | 3,
): string {
  const wrapped =
    text.includes(CONTEXT_OPEN) ? text : `${CONTEXT_OPEN}\n${text}\n${CONTEXT_CLOSE}`;
  return degradeTaggedContextJsonMessage(wrapped, level);
}
