/**
 * 从 LLM 正文解析 Host Tool 结构化 arguments（instant 交付用）。
 * 软校验：required 键存在 + 与 schema.type 粗对齐（string/number/boolean/array/object）。
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripMarkdownFences(text: string): string {
  const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  // 未闭合围栏：```json\n{...}
  const open = text.match(/^```(?:json|JSON)?\s*\r?\n?([\s\S]*)$/);
  if (open?.[1]) {
    return open[1].replace(/```\s*$/, '').trim();
  }
  return text;
}

/** 去掉模型常加的裸语言标签：`json\n{...}`（无 markdown 围栏）。 */
function stripLeadingLanguageTag(text: string): string {
  return text.replace(/^(json|JSON|javascript|JavaScript)\s*\r?\n/, '');
}

/** 按花括号平衡扫描，提取文本中所有完整 `{...}` 片段（从左到右）。 */
function extractBalancedJsonObjectSlices(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
    } else if (ch === '}') {
      if (depth === 0) {
        continue;
      }
      depth -= 1;
      if (depth === 0 && start >= 0) {
        out.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return out;
}

function tryParseJsonRecord(candidate: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(candidate) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 从 LLM 输出中提取 JSON object。
 * 兼容：markdown 围栏、裸 `json` 前缀、think 噪声中的多个 `{`（取最后一个可解析 object）。
 */
export function extractJsonObjectFromLlmText(
  content: string,
): Record<string, unknown> | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }
  const withoutFence = stripMarkdownFences(trimmed);
  const candidate = stripLeadingLanguageTag(withoutFence.trim());

  const direct = tryParseJsonRecord(candidate);
  if (direct) {
    return direct;
  }

  // 从后往前试完整平衡 object：优先靠近文末的参数 JSON，避开 think 里的 `{`
  const slices = extractBalancedJsonObjectSlices(candidate);
  for (let i = slices.length - 1; i >= 0; i -= 1) {
    const parsed = tryParseJsonRecord(slices[i]!);
    if (parsed) {
      return parsed;
    }
  }
  return null;
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
 * 兼容模型把工具名包在外层：`{ "applyBlogCategoryTags": { ...args } }`。
 * 仅当外层不合 schema、内层 object 合 schema 时解包。
 */
export function unwrapHostToolArgsEnvelope(
  parsed: Record<string, unknown>,
  argsSchema: Record<string, unknown>,
): Record<string, unknown> {
  if (softValidateHostToolArgsAgainstSchema(parsed, argsSchema)) {
    return parsed;
  }
  const keys = Object.keys(parsed);
  if (keys.length === 1) {
    const inner = parsed[keys[0]!];
    if (isRecord(inner) && softValidateHostToolArgsAgainstSchema(inner, argsSchema)) {
      return inner;
    }
  }
  for (const value of Object.values(parsed)) {
    if (isRecord(value) && softValidateHostToolArgsAgainstSchema(value, argsSchema)) {
      return value;
    }
  }
  return parsed;
}

export type ParseHostToolArgsFromLlmResult =
  | { ok: true; args: Record<string, unknown> }
  | {
      ok: false;
      reason: 'parse_failed' | 'validate_failed';
      preview: string;
    };

/**
 * LLM 正文 → Host Tool arguments（带失败分型，便于审计）。
 */
export function parseHostToolArgsFromLlmTextDetailed(input: {
  text: string;
  argsSchema: Record<string, unknown>;
}): ParseHostToolArgsFromLlmResult {
  const preview = input.text.trim().slice(0, 240);
  const extracted = extractJsonObjectFromLlmText(input.text);
  if (!extracted) {
    return { ok: false, reason: 'parse_failed', preview };
  }
  const args = unwrapHostToolArgsEnvelope(extracted, input.argsSchema);
  if (!softValidateHostToolArgsAgainstSchema(args, input.argsSchema)) {
    return { ok: false, reason: 'validate_failed', preview };
  }
  return { ok: true, args };
}

/**
 * LLM 正文 → Host Tool arguments。
 * 解析失败或软校验失败返回 null（调用方应标 dsl failed，而非 silent skip）。
 */
export function parseHostToolArgsFromLlmText(input: {
  text: string;
  argsSchema: Record<string, unknown>;
}): Record<string, unknown> | null {
  const detailed = parseHostToolArgsFromLlmTextDetailed(input);
  return detailed.ok ? detailed.args : null;
}

/**
 * 多候选正文依次解析（message 通道 / 去 think 后全文 / sanitize 正文）。
 * 避免只用 raw 或只用 content 时被 think 花括号污染。
 */
export function parseHostToolArgsFromLlmTextCandidates(input: {
  candidates: Array<string | null | undefined>;
  argsSchema: Record<string, unknown>;
}): ParseHostToolArgsFromLlmResult {
  let lastFail: ParseHostToolArgsFromLlmResult = {
    ok: false,
    reason: 'parse_failed',
    preview: '',
  };
  for (const candidate of input.candidates) {
    const text = candidate?.trim();
    if (!text) {
      continue;
    }
    const result = parseHostToolArgsFromLlmTextDetailed({
      text,
      argsSchema: input.argsSchema,
    });
    if (result.ok) {
      return result;
    }
    lastFail = result;
  }
  return lastFail;
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
