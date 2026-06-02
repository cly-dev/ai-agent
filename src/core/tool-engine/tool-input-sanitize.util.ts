/**
 * 工具 HTTP 调用前对 LLM / 调试入参做合法化，避免控制字符、错误类型导致请求失败。
 */

import { getDefaultXShopId } from '../../common/integration-site.util';

export type OpenApiParamSpec = {
  name: string;
  in: string;
  type?: string;
  itemsType?: string;
  collectionFormat?: string;
  default?: unknown;
};

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

export function collectOpenApiParameterSpecs(schema: unknown): OpenApiParamSpec[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return [];
  }
  const row = schema as Record<string, unknown>;
  const parameters = row.parameters;
  if (!Array.isArray(parameters)) {
    return [];
  }
  const out: OpenApiParamSpec[] = [];
  for (const item of parameters) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    const p = item as Record<string, unknown>;
    const name = p.name;
    const inn = p.in;
    if (typeof name !== 'string' || typeof inn !== 'string') {
      continue;
    }
    const items =
      p.items && typeof p.items === 'object' && !Array.isArray(p.items)
        ? (p.items as Record<string, unknown>)
        : undefined;
    const itemsType = typeof items?.type === 'string' ? items.type : undefined;
    out.push({
      name,
      in: inn,
      type: typeof p.type === 'string' ? p.type : undefined,
      itemsType,
      collectionFormat:
        typeof p.collectionFormat === 'string' ? p.collectionFormat : undefined,
      default: 'default' in p ? p.default : undefined,
    });
  }
  return out;
}

/** 补全 OpenAPI default / 全局站点头，在 sanitize 之前调用。 */
export function applyToolParameterDefaults(
  input: Record<string, unknown>,
  specs: OpenApiParamSpec[],
): Record<string, unknown> {
  const out = { ...input };
  for (const spec of specs) {
    if (out[spec.name] !== undefined && out[spec.name] !== null) {
      continue;
    }
    if (spec.name === 'X-SHOP-ID') {
      out[spec.name] = getDefaultXShopId();
      continue;
    }
    if (spec.default !== undefined) {
      out[spec.name] = spec.default;
    }
  }
  return out;
}

/** 在 resolve URL / header / body 之前调用。 */
export function sanitizeToolInvokeInput(
  input: Record<string, unknown>,
  specs: OpenApiParamSpec[],
): Record<string, unknown> {
  const specByName = new Map(specs.map((spec) => [spec.name, spec]));
  const out: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(input)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }
    const spec = specByName.get(key);
    const coerced = coerceBySpec(rawValue, spec, key);
    if (coerced === undefined) {
      continue;
    }
    out[key] = coerced;
  }

  return out;
}

function coerceBySpec(
  value: unknown,
  spec: OpenApiParamSpec | undefined,
  fieldName: string,
): unknown {
  const type = spec?.type ?? inferValueType(value);
  const itemsType = spec?.itemsType;
  const inHeader = spec?.in === 'header';

  if (type === 'array') {
    const arr = coerceToArray(value, itemsType);
    if (!arr || arr.length === 0) {
      return undefined;
    }
    return arr;
  }

  if (type === 'integer' || type === 'number') {
    return coerceNumber(value, fieldName, type === 'integer');
  }

  if (type === 'boolean') {
    return coerceBoolean(value);
  }

  if (type === 'object') {
    return coerceObject(value, inHeader);
  }

  return coerceString(value, inHeader ? 'header' : 'default');
}

function inferValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  if (typeof value === 'object' && value !== null) {
    return 'object';
  }
  return 'string';
}

function coerceToArray(
  value: unknown,
  itemType: string | undefined,
): unknown[] | undefined {
  if (Array.isArray(value)) {
    return value
      .map((item) => coerceArrayItem(item, itemType))
      .filter((item) => item !== undefined && item !== null && item !== '');
  }
  if (typeof value === 'string') {
    const trimmed = sanitizeString(value, 'default');
    if (!trimmed) {
      return undefined;
    }
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return coerceToArray(parsed, itemType);
        }
      } catch {
        // fall through
      }
    }
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((part) => coerceArrayItem(part.trim(), itemType))
        .filter((item) => item !== undefined && item !== null && item !== '');
    }
    const single = coerceArrayItem(trimmed, itemType);
    return single === undefined ? undefined : [single];
  }
  const single = coerceArrayItem(value, itemType);
  return single === undefined ? undefined : [single];
}

function coerceArrayItem(
  value: unknown,
  itemType: string | undefined,
): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  const type = itemType ?? inferValueType(value);
  if (type === 'integer' || type === 'number') {
    return coerceNumber(value, 'item', type === 'integer');
  }
  if (type === 'boolean') {
    return coerceBoolean(value);
  }
  return coerceString(value, 'default');
}

function coerceNumber(
  value: unknown,
  _fieldName: string,
  integer: boolean,
): number | string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return integer ? Math.trunc(value) : value;
  }
  if (typeof value === 'string') {
    const trimmed = sanitizeString(value, 'default');
    if (!trimmed) {
      return undefined;
    }
    if (/^-?\d+$/.test(trimmed) && trimmed.length > 15) {
      return trimmed;
    }
    const parsed = integer ? Number.parseInt(trimmed, 10) : Number(trimmed);
    if (Number.isFinite(parsed)) {
      return integer ? Math.trunc(parsed) : parsed;
    }
    return undefined;
  }
  return undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const t = sanitizeString(value, 'default').toLowerCase();
    if (t === 'true' || t === '1' || t === 'yes') {
      return true;
    }
    if (t === 'false' || t === '0' || t === 'no') {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  return undefined;
}

function coerceObject(
  value: unknown,
  inHeader: boolean,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const row = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(row)) {
    const coerced = coerceBySpec(item, undefined, key);
    if (coerced !== undefined) {
      out[key] = coerced;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceString(
  value: unknown,
  mode: 'default' | 'header',
): string | undefined {
  if (typeof value === 'string') {
    const s = sanitizeString(value, mode);
    return s.length > 0 ? s : undefined;
  }
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return undefined;
    }
  }
  return sanitizeString(String(value), mode) || undefined;
}

function sanitizeString(value: string, mode: 'default' | 'header'): string {
  let s = value
    .normalize('NFKC')
    .replace(CONTROL_CHARS, '')
    .replace(ZERO_WIDTH, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();
  if (mode === 'header') {
    s = s.replace(/[\r\n]+/g, ' ').trim();
  }
  return s;
}

/** query / path 标量序列化（避免 [object Object]）。 */
export function formatQueryScalar(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return sanitizeString(value, 'default');
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  try {
    return JSON.stringify(value);
  } catch {
    return sanitizeString(String(value), 'default');
  }
}
