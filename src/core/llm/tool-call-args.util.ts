/**
 * 工具调用参数的 JSON 若含超过 Number.MAX_SAFE_INTEGER 的整数，标准 JSON.parse 会丢精度。
 * 通过在解析前把「大整数」字面量改写为字符串，再在下游用 String(...) 发往 HTTP，可保持 ID 一致。
 */

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);

function isWholeNumberToken(raw: string): boolean {
  if (raw.length === 0) {
    return false;
  }
  if (raw === '-') {
    return false;
  }
  const body = raw[0] === '-' ? raw.slice(1) : raw;
  if (body.length === 0 || (body[0] === '0' && body.length > 1)) {
    return false;
  }
  return /^[0-9]+$/.test(body);
}

function bigintExceedsSafeRange(intToken: string): boolean {
  try {
    const bi = BigInt(intToken);
    return bi > MAX_SAFE || bi < MIN_SAFE;
  } catch {
    return false;
  }
}

/**
 * 扫描 JSON 文本（需在 parse 之前调用），跳过字符串内部，仅将超长或超安全范围的整数字面量替换为字符串形式。
 */
export function coerceLongIntegerLiteralsToQuotedStrings(
  jsonText: string,
): string {
  let out = '';
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < jsonText.length) {
    const c = jsonText[i];
    if (inString) {
      out += c;
      if (escaped) {
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (c === '"') {
      inString = true;
      out += c;
      i += 1;
      continue;
    }

    const isNumStart = c === '-' || (c >= '0' && c <= '9');
    if (isNumStart) {
      const start = i;
      let j = i;
      if (jsonText[j] === '-') {
        j += 1;
      }
      if (j >= jsonText.length || jsonText[j] < '0' || jsonText[j] > '9') {
        out += c;
        i += 1;
        continue;
      }
      while (j < jsonText.length && jsonText[j] >= '0' && jsonText[j] <= '9') {
        j += 1;
      }
      const intPart = jsonText.slice(start, j);

      let k = j;
      if (k < jsonText.length && jsonText[k] === '.') {
        k += 1;
        while (
          k < jsonText.length &&
          jsonText[k] >= '0' &&
          jsonText[k] <= '9'
        ) {
          k += 1;
        }
      }
      if (k < jsonText.length && (jsonText[k] === 'e' || jsonText[k] === 'E')) {
        k += 1;
        if (
          k < jsonText.length &&
          (jsonText[k] === '+' || jsonText[k] === '-')
        ) {
          k += 1;
        }
        while (
          k < jsonText.length &&
          jsonText[k] >= '0' &&
          jsonText[k] <= '9'
        ) {
          k += 1;
        }
      }

      if (k > j) {
        out += jsonText.slice(start, k);
        i = k;
        continue;
      }

      if (isWholeNumberToken(intPart) && bigintExceedsSafeRange(intPart)) {
        out += `"${intPart}"`;
      } else {
        out += intPart;
      }
      i = j;
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

/** 将 LLM / LangChain 给出的 tool arguments 规范为普通对象；字符串 JSON 会先做大整数保护再 parse。 */
export function normalizeToolCallArgs(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) {
      return {};
    }
    try {
      const safeText = coerceLongIntegerLiteralsToQuotedStrings(t);
      const parsed: unknown = JSON.parse(safeText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
    return {};
  }
  return {};
}
