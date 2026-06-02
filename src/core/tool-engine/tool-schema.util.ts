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

function convertParameterSchema(
  param: Record<string, unknown>,
): Record<string, unknown> {
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
    items &&
    typeof items === 'object' &&
    !Array.isArray(items)
  ) {
    schema.items = convertItemsSchema(items as Record<string, unknown>);
  }
  return schema;
}

function convertItemsSchema(
  items: Record<string, unknown>,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {};
  const type = items.type;
  schema.type = typeof type === 'string' ? mapOpenApiType(type) : 'string';
  const enumValue = items.enum;
  if (Array.isArray(enumValue) && enumValue.length > 0) {
    schema.enum = enumValue;
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
