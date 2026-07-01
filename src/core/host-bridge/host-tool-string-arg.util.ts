/** Host Tool argsSchema / arguments 中正文类 string 字段的通用优先级。 */
export const HOST_TOOL_STRING_ARG_KEYS = [
  'text',
  'content',
  'value',
  'draft',
  'body',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 从 argsSchema.properties 推断可流式/可展示的 string 字段名。 */
export function pickHostToolStringArgKey(
  properties: Record<string, unknown>,
): string | null {
  for (const key of HOST_TOOL_STRING_ARG_KEYS) {
    const def = properties[key];
    if (isRecord(def) && def.type === 'string') {
      return key;
    }
  }
  for (const [key, def] of Object.entries(properties)) {
    if (isRecord(def) && def.type === 'string') {
      return key;
    }
  }
  return null;
}

/** 从 arguments 按优先级读取首个非空 string 值。 */
export function readHostToolStringArg(
  args: Record<string, unknown>,
): string | null {
  for (const key of HOST_TOOL_STRING_ARG_KEYS) {
    const value = args[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
}

/** 在 arguments 中定位已有 string 字段名，否则默认 `text`。 */
export function resolveHostToolStringArgKey(
  args: Record<string, unknown>,
): string {
  for (const key of HOST_TOOL_STRING_ARG_KEYS) {
    if (key in args) {
      return key;
    }
  }
  return 'text';
}
