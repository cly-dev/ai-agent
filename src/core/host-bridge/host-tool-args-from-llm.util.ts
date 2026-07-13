/**
 * 从 LLM 正文解析 Host Tool 结构化 arguments（instant 交付用）。
 * 软校验：required 键存在 + 与 schema.type 粗对齐（string/number/boolean/array/object）。
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 从 LLM 输出中提取首个 JSON object（支持 ```json 围栏）。 */
export function extractJsonObjectFromLlmText(
  content: string,
): Record<string, unknown> | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    const parsed = JSON.parse(candidate) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end <= start) {
      return null;
    }
    try {
      const parsed = JSON.parse(candidate.slice(start, end + 1)) as unknown;
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function typeTokenMatches(value: unknown, typeToken: string): boolean {
  switch (typeToken) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return isRecord(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function valueMatchesPropDef(value: unknown, def: Record<string, unknown>): boolean {
  const type = def.type;
  if (typeof type === 'string') {
    return typeTokenMatches(value, type);
  }
  if (Array.isArray(type) && type.length > 0) {
    return type.some(
      (token) => typeof token === 'string' && typeTokenMatches(value, token),
    );
  }
  // 无 type：有 items 则期望 array，有 properties 则期望 object
  if (def.items != null) {
    return Array.isArray(value);
  }
  if (isRecord(def.properties)) {
    return isRecord(value);
  }
  return true;
}

/** 软校验：required 键存在，且与 properties[key].type 粗对齐。 */
export function softValidateHostToolArgsAgainstSchema(
  args: Record<string, unknown>,
  argsSchema: Record<string, unknown>,
): boolean {
  const properties = isRecord(argsSchema.properties)
    ? (argsSchema.properties as Record<string, unknown>)
    : null;
  const required = argsSchema.required;

  if (!Array.isArray(required) || required.length === 0) {
    if (Object.keys(args).length === 0) {
      return false;
    }
    // 无 required：仍校验已出现键的类型（若 schema 有定义）
    if (!properties) {
      return true;
    }
    for (const [key, value] of Object.entries(args)) {
      const def = properties[key];
      if (isRecord(def) && !valueMatchesPropDef(value, def)) {
        return false;
      }
    }
    return true;
  }

  for (const key of required) {
    if (typeof key !== 'string' || key.length === 0) {
      continue;
    }
    if (!(key in args)) {
      return false;
    }
    const def = properties?.[key];
    if (isRecord(def) && !valueMatchesPropDef(args[key], def)) {
      return false;
    }
  }
  return true;
}

/**
 * LLM 正文 → Host Tool arguments。
 * 解析失败或软校验失败返回 null（调用方应标 dsl failed，而非 silent skip）。
 */
export function parseHostToolArgsFromLlmText(input: {
  text: string;
  argsSchema: Record<string, unknown>;
}): Record<string, unknown> | null {
  const args = extractJsonObjectFromLlmText(input.text);
  if (!args) {
    return null;
  }
  if (!softValidateHostToolArgsAgainstSchema(args, input.argsSchema)) {
    return null;
  }
  return args;
}

const DISPLAY_STRING_CAP = 12;
const DISPLAY_CHAR_CAP = 4_000;

/**
 * 从结构化 args 拼展示文案（协议级扫 string 叶子，不绑定业务字段名）。
 * 供 lifecycle text；权威仍用 JSON.stringify(args) 持久化以便重放。
 */
export function buildHostToolArgsDisplayText(
  args: Record<string, unknown>,
): string {
  const leaves: string[] = [];
  const visit = (value: unknown) => {
    if (leaves.length >= DISPLAY_STRING_CAP) {
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        leaves.push(trimmed);
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
        if (leaves.length >= DISPLAY_STRING_CAP) {
          return;
        }
      }
      return;
    }
    if (isRecord(value)) {
      for (const child of Object.values(value)) {
        visit(child);
        if (leaves.length >= DISPLAY_STRING_CAP) {
          return;
        }
      }
    }
  };
  visit(args);
  if (leaves.length === 0) {
    return JSON.stringify(args);
  }
  const joined = leaves.join('\n\n');
  if (joined.length <= DISPLAY_CHAR_CAP) {
    return joined;
  }
  return `${joined.slice(0, DISPLAY_CHAR_CAP)}…`;
}
