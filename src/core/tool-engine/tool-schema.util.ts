import { z } from 'zod';
import { jsonSchemaToZod } from './json-schema-to-zod.util';

/** 数据库 / OpenAPI 工具定义 → LangChain bindTools 可用的 Zod schema。 */

export type ToolDefinitionInput = {
  id: number;
  name: string;
  description: string;
  inputSchema: unknown;
  schema: unknown;
};

/**
 * 优先 inputSchema，失败后回退 schema，最后兜底空 object。
 * 先归一化为 JSON Schema，再转为 Zod（LangChain `tool` 推荐 Zod 结构）。
 */
export function resolveToolZodSchema(
  inputSchema: unknown,
  fallbackSchema: unknown,
): z.ZodTypeAny {
  return jsonSchemaToZod(resolveToolJsonSchema(inputSchema, fallbackSchema));
}

/** 归一化后的 JSON Schema（调试、OpenAPI 导出等场景）。 */
export function resolveToolJsonSchema(
  inputSchema: unknown,
  fallbackSchema: unknown,
): Record<string, unknown> {
  const primary = normalizeJsonSchemaLike(inputSchema);
  if (primary) {
    return primary;
  }
  const fallback = normalizeJsonSchemaLike(fallbackSchema);
  if (fallback) {
    return fallback;
  }
  return emptyObjectJsonSchema();
}

function emptyObjectJsonSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };
}

/** 对象型 JSON Schema 禁止未声明字段，便于 LLM 生成合规参数。 */
function finalizeObjectJsonSchema(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  if (schema.type !== 'object') {
    return schema;
  }
  return {
    ...schema,
    additionalProperties: false,
  };
}

/** 兼容标准 JSON Schema / OpenAPI parameters / requestBody。 */
function normalizeJsonSchemaLike(
  source: unknown,
): Record<string, unknown> | null {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }
  const row = source as Record<string, unknown>;
  if (isStandardJsonSchema(row)) {
    return finalizeObjectJsonSchema(row);
  }
  const byParameters = convertOpenApiParameters(row);
  if (byParameters) {
    return byParameters;
  }
  const byRequestBody = convertOpenApiRequestBody(row);
  if (byRequestBody) {
    return byRequestBody;
  }
  return null;
}

function isStandardJsonSchema(value: Record<string, unknown>): boolean {
  const type = value.type;
  const properties = value.properties;
  return (
    type === 'object' &&
    properties !== null &&
    typeof properties === 'object' &&
    !Array.isArray(properties)
  );
}

function convertOpenApiParameters(
  value: Record<string, unknown>,
): Record<string, unknown> | null {
  const parameters = value.parameters;
  if (!Array.isArray(parameters) || parameters.length === 0) {
    return null;
  }
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const item of parameters) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      continue;
    }
    const param = item as Record<string, unknown>;
    const name = param.name;
    if (typeof name !== 'string' || name.trim().length === 0) {
      continue;
    }
    properties[name] = convertParameterSchema(param);
    if (param.required === true) {
      required.push(name);
    }
  }
  const result: Record<string, unknown> = {
    type: 'object',
    properties,
    additionalProperties: false,
  };
  if (required.length > 0) {
    result.required = Array.from(new Set(required));
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 递归归一化 Swagger schema（含 array<object{…}> / 嵌套 properties）。 */
function convertNestedJsonSchema(
  node: Record<string, unknown>,
): Record<string, unknown> {
  const ref = node.$ref ?? node.originalRef;
  if (typeof ref === 'string' && ref.trim().length > 0) {
    return { $ref: ref.trim() };
  }

  const typeRaw = typeof node.type === 'string' ? node.type : undefined;
  const type = typeRaw ? mapOpenApiType(typeRaw) : undefined;
  const out: Record<string, unknown> = {};

  if (typeof node.description === 'string' && node.description.trim().length > 0) {
    out.description = node.description.trim();
  }
  if (Array.isArray(node.enum) && node.enum.length > 0) {
    out.enum = node.enum;
  }
  if (typeof node.format === 'string' && node.format.trim().length > 0) {
    out.format = node.format.trim();
  }

  if (type === 'array' && isRecord(node.items)) {
    out.type = 'array';
    out.items = convertNestedJsonSchema(node.items);
    return out;
  }

  if (type === 'object' || isRecord(node.properties)) {
    out.type = 'object';
    const properties = isRecord(node.properties) ? node.properties : {};
    const props: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(properties)) {
      if (isRecord(raw)) {
        props[key] = convertNestedJsonSchema(raw);
      }
    }
    out.properties = props;
    if (Array.isArray(node.required)) {
      out.required = node.required.filter(
        (field): field is string => typeof field === 'string',
      );
    }
    return finalizeObjectJsonSchema(out);
  }

  out.type = type ?? 'string';
  return out;
}

function convertParameterSchema(
  param: Record<string, unknown>,
): Record<string, unknown> {
  const nested = param.schema;
  if (isRecord(nested)) {
    const schema = convertNestedJsonSchema(nested);
    const description = param.description;
    if (
      typeof description === 'string' &&
      description.trim().length > 0 &&
      (typeof schema.description !== 'string' || schema.description.length === 0)
    ) {
      schema.description = description.trim();
    }
    return schema;
  }

  const schema: Record<string, unknown> = {};
  const type = param.type;
  if (typeof type === 'string') {
    schema.type = mapOpenApiType(type);
  } else {
    schema.type = 'string';
  }
  const description = param.description;
  if (typeof description === 'string' && description.trim().length > 0) {
    schema.description = description;
  }
  const enumValue = param.enum;
  if (Array.isArray(enumValue) && enumValue.length > 0) {
    schema.enum = enumValue;
  }
  const items = param.items;
  if (
    schema.type === 'array' &&
    isRecord(items)
  ) {
    schema.items = convertNestedJsonSchema(items);
  }
  if (schema.type === 'object' && isRecord(param.properties)) {
    return convertNestedJsonSchema({
      type: 'object',
      properties: param.properties,
      required: param.required,
      description: schema.description,
    });
  }
  return schema;
}

function mapOpenApiType(value: string): string {
  switch (value) {
    case 'integer':
    case 'number':
    case 'string':
    case 'boolean':
    case 'array':
    case 'object':
      return value;
    default:
      return 'string';
  }
}

function convertOpenApiRequestBody(
  value: Record<string, unknown>,
): Record<string, unknown> | null {
  const requestBody = value.requestBody;
  if (
    !requestBody ||
    typeof requestBody !== 'object' ||
    Array.isArray(requestBody)
  ) {
    return null;
  }
  const body = requestBody as Record<string, unknown>;
  const content = body.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }
  const contentRow = content as Record<string, unknown>;
  const appJson = contentRow['application/json'];
  if (!appJson || typeof appJson !== 'object' || Array.isArray(appJson)) {
    return null;
  }
  const appJsonRow = appJson as Record<string, unknown>;
  const schema = appJsonRow.schema;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return null;
  }
  return finalizeObjectJsonSchema(schema as Record<string, unknown>);
}
