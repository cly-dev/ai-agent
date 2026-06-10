import {
  normalizeAgentMetadata,
  parseAgentMetadata,
} from './tool-agent-metadata.util';
import type { AgentMetadata, ParamFormatHint } from './tool-agent-metadata.types';

/**
 * Compact input for the decision loop.
 * Mirrors Tool.inputSchema: `{ parameters, requestBody }` + agentMetadata hints.
 */

export type ToolParamCompact = {
  name: string;
  required: boolean;
  in?: string;
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  /** Swagger body param or nested object ($ref summarized). */
  schemaRef?: string;
};

export type RequestBodyCompact = {
  required?: boolean;
  description?: string;
  schemaRef?: string;
  properties?: ToolParamCompact[];
};

export type CompactToolInput = {
  parameters: ToolParamCompact[];
  requestBody?: RequestBodyCompact | null;
  /** Optional params omitted from detailed list when schema is very large. */
  optionalParamNames?: string[];
};

function normalizeDescription(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readFormat(param: Record<string, unknown>): string | undefined {
  const direct =
    typeof param.format === 'string' && param.format.trim().length > 0
      ? param.format.trim()
      : undefined;
  if (direct) {
    return direct;
  }
  const schema = param.schema;
  if (isRecord(schema) && typeof schema.format === 'string' && schema.format.trim()) {
    return schema.format.trim();
  }
  return undefined;
}

/** Recursively describe JSON Schema / Swagger schema for LLM type hints. */
export function describeJsonSchemaType(
  schema: Record<string, unknown>,
  visited: WeakSet<Record<string, unknown>> = new WeakSet(),
): string {
  if (visited.has(schema)) {
    return '…';
  }
  visited.add(schema);

  const ref = readSchemaRef(schema);
  if (ref) {
    return ref;
  }

  const enumValues = readEnum(schema);
  if (enumValues && enumValues.length > 0) {
    return `enum(${enumValues.join('|')})`;
  }

  const typeRaw = typeof schema.type === 'string' ? schema.type : undefined;
  const format =
    typeof schema.format === 'string' && schema.format.trim().length > 0
      ? schema.format.trim()
      : undefined;

  if (typeRaw === 'array') {
    const items = isRecord(schema.items) ? schema.items : null;
    const itemDesc = items ? describeJsonSchemaType(items, visited) : 'unknown';
    return `array<${itemDesc}>`;
  }

  const properties = isRecord(schema.properties) ? schema.properties : null;
  if (typeRaw === 'object' || (!typeRaw && properties)) {
    if (!properties || Object.keys(properties).length === 0) {
      return 'object';
    }
    const requiredSet = new Set(
      Array.isArray(schema.required)
        ? schema.required.filter((field): field is string => typeof field === 'string')
        : [],
    );
    const fields = Object.entries(properties).map(([key, raw]) => {
      if (!isRecord(raw)) {
        return `${key}:unknown`;
      }
      const opt = requiredSet.has(key) ? '' : '?';
      const inner = describeJsonSchemaType(raw, visited);
      const propDesc =
        typeof raw.description === 'string' ? raw.description.trim() : '';
      return propDesc
        ? `${key}${opt}:${inner}(${propDesc})`
        : `${key}${opt}:${inner}`;
    });
    return `object{${fields.join(', ')}}`;
  }

  if (typeRaw) {
    if (format && format !== typeRaw && format !== 'false' && format !== 'true') {
      return `${typeRaw}(${format})`;
    }
    return typeRaw;
  }

  return 'unknown';
}

function readParamType(param: Record<string, unknown>): string | undefined {
  const schema = param.schema;
  if (isRecord(schema)) {
    return describeJsonSchemaType(schema);
  }
  const type = param.type;
  if (typeof type === 'string') {
    if (type === 'array' && isRecord(param.items)) {
      return describeJsonSchemaType({ type: 'array', items: param.items });
    }
    if (type === 'object' && isRecord(param.properties)) {
      return describeJsonSchemaType(param);
    }
    const format = readFormat(param);
    if (format && format !== type && format !== 'false' && format !== 'true') {
      return `${type}(${format})`;
    }
    return type;
  }
  return undefined;
}

function schemaHasNestedStructure(schema: Record<string, unknown>): boolean {
  const type = typeof schema.type === 'string' ? schema.type : undefined;
  if (type === 'object' && isRecord(schema.properties)) {
    return Object.keys(schema.properties).length > 0;
  }
  if (type === 'array' && isRecord(schema.items)) {
    return schemaHasNestedStructure(schema.items);
  }
  return false;
}

function compactRowFromSchemaNode(
  name: string,
  schemaNode: Record<string, unknown>,
  required: boolean,
  location: string | undefined,
): ToolParamCompact {
  return {
    name,
    required,
    in: location ?? 'body',
    type: readParamType({ schema: schemaNode }) ?? 'unknown',
    format: readFormat(schemaNode),
    description: normalizeDescription(
      typeof schemaNode.description === 'string' ? schemaNode.description : undefined,
    ),
    enum: readEnum(schemaNode),
    schemaRef: readSchemaRef(schemaNode),
  };
}

/** 仅用于 paramFormatHints：展开 array/object 嵌套（数组元素路径用 `[]`）。 */
function collectNestedHintParams(
  schemaNode: Record<string, unknown>,
  basePath: string,
  location: string | undefined,
  collector: ToolParamCompact[],
): void {
  const typeRaw = typeof schemaNode.type === 'string' ? schemaNode.type : undefined;

  if (typeRaw === 'array' && isRecord(schemaNode.items)) {
    collectNestedHintParams(schemaNode.items, `${basePath}[]`, location, collector);
    return;
  }

  const properties = isRecord(schemaNode.properties) ? schemaNode.properties : null;
  if (typeRaw === 'object' || (!typeRaw && properties)) {
    if (!properties) {
      return;
    }
    const requiredSet = new Set(
      Array.isArray(schemaNode.required)
        ? schemaNode.required.filter((field): field is string => typeof field === 'string')
        : [],
    );
    for (const [key, raw] of Object.entries(properties)) {
      if (!isRecord(raw)) {
        continue;
      }
      const childPath = basePath ? `${basePath}.${key}` : key;
      collector.push(
        compactRowFromSchemaNode(childPath, raw, requiredSet.has(key), location),
      );
      if (schemaHasNestedStructure(raw)) {
        collectNestedHintParams(raw, childPath, location, collector);
      }
    }
  }
}

function readSchemaRef(schema: Record<string, unknown>): string | undefined {
  if (typeof schema.$ref === 'string' && schema.$ref.trim().length > 0) {
    return schema.$ref.trim();
  }
  if (
    typeof schema.originalRef === 'string' &&
    schema.originalRef.trim().length > 0
  ) {
    return schema.originalRef.trim();
  }
  return undefined;
}

function readEnum(source: Record<string, unknown>): string[] | undefined {
  const values = source.enum;
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }
  return values.map((item) => String(item));
}

function flattenInlineSchemaProperties(
  schema: Record<string, unknown>,
  requiredSet: Set<string>,
): ToolParamCompact[] {
  const properties = isRecord(schema.properties) ? schema.properties : null;
  if (!properties) {
    return [];
  }
  const bodyRequired = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((field): field is string => typeof field === 'string')
      : [],
  );
  const rows: ToolParamCompact[] = [];
  for (const [name, raw] of Object.entries(properties)) {
    if (!isRecord(raw)) {
      continue;
    }
    rows.push(
      compactRowFromSchemaNode(
        name,
        raw,
        bodyRequired.has(name) || requiredSet.has(name),
        'body',
      ),
    );
  }
  return rows;
}

function compactOpenApiParameter(item: Record<string, unknown>): ToolParamCompact | null {
  const name =
    typeof item.name === 'string' && item.name.trim().length > 0
      ? item.name.trim()
      : null;
  if (!name) {
    return null;
  }
  const location = typeof item.in === 'string' ? item.in : undefined;
  const schema = isRecord(item.schema) ? item.schema : null;

  if (location === 'body' || schema) {
    const bodySchema = schema ?? item;
    const schemaRef = isRecord(bodySchema) ? readSchemaRef(bodySchema) : undefined;

    return {
      name,
      required: item.required === true,
      in: location ?? 'body',
      type:
        bodySchema && isRecord(bodySchema)
          ? readParamType({ schema: bodySchema })
          : readParamType(item),
      format: readFormat(item),
      description: normalizeDescription(
        typeof item.description === 'string' ? item.description : undefined,
      ),
      enum: schema ? readEnum(schema) : readEnum(item),
      schemaRef,
    };
  }

  return {
    name,
    required: item.required === true,
    in: location,
    type: readParamType(item),
    format: readFormat(item),
    description: normalizeDescription(
      typeof item.description === 'string' ? item.description : undefined,
    ),
    enum: readEnum(item),
  };
}

function extractParametersFromOpenApiDocument(source: unknown): ToolParamCompact[] {
  if (!isRecord(source)) {
    return [];
  }
  const parameters = source.parameters;
  if (!Array.isArray(parameters)) {
    return [];
  }
  const rows: ToolParamCompact[] = [];
  for (const item of parameters) {
    if (!isRecord(item)) {
      continue;
    }
    const row = compactOpenApiParameter(item);
    if (row) {
      rows.push(row);
    }
  }
  return rows;
}

function extractRequestBodyFromOpenApiDocument(
  source: unknown,
): RequestBodyCompact | null | undefined {
  if (!isRecord(source)) {
    return undefined;
  }
  const requestBody = source.requestBody;
  if (requestBody == null) {
    return null;
  }
  if (!isRecord(requestBody)) {
    return null;
  }

  const description = normalizeDescription(
    typeof requestBody.description === 'string'
      ? requestBody.description
      : undefined,
  );
  const required =
    typeof requestBody.required === 'boolean' ? requestBody.required : undefined;

  const content = requestBody.content;
  if (!isRecord(content)) {
    return { required, description };
  }
  const appJson = content['application/json'];
  if (!isRecord(appJson)) {
    return { required, description };
  }
  const schema = appJson.schema;
  if (!isRecord(schema)) {
    return { required, description };
  }

  const schemaRef = readSchemaRef(schema);
  const requiredSet = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((field): field is string => typeof field === 'string')
      : [],
  );
  const properties = flattenInlineSchemaProperties(schema, requiredSet);

  return {
    required,
    description,
    schemaRef,
    ...(properties.length > 0 ? { properties } : {}),
  };
}

function resolveOpenApiInputDocument(
  inputSchema: unknown,
  fallbackSchema: unknown,
): Record<string, unknown> | null {
  if (isRecord(inputSchema) && Array.isArray(inputSchema.parameters)) {
    return inputSchema;
  }
  if (isRecord(fallbackSchema) && Array.isArray(fallbackSchema.parameters)) {
    return fallbackSchema;
  }
  return null;
}

function scoreOptionalParam(
  param: ToolParamCompact,
  businessFields: string[],
): number {
  let score = 0;
  const nameLower = param.name.toLowerCase();
  const descLower = (param.description ?? '').toLowerCase();
  for (const field of businessFields) {
    const normalized = field.toLowerCase();
    if (
      nameLower.includes(normalized) ||
      normalized.includes(nameLower) ||
      descLower.includes(normalized)
    ) {
      score += 100;
    }
  }
  return score;
}

function prioritizeOptionalParams(
  optional: ToolParamCompact[],
  businessFields: string[],
): ToolParamCompact[] {
  return [...optional].sort((a, b) => {
    const diff =
      scoreOptionalParam(b, businessFields) - scoreOptionalParam(a, businessFields);
    if (diff !== 0) {
      return diff;
    }
    return a.name.localeCompare(b.name);
  });
}

function formatParamFormatHintSuffix(hint: ParamFormatHint): string {
  return hint.example
    ? `[format] ${hint.hint} (e.g. ${hint.example})`
    : `[format] ${hint.hint}`;
}

function formatLocationHint(location: string | undefined): string | undefined {
  if (!location) {
    return undefined;
  }
  return `in=${location}`;
}

function defaultExampleForType(type: string | undefined): string | undefined {
  if (!type) {
    return undefined;
  }
  if (type.startsWith('array<')) {
    return '[]';
  }
  if (type.startsWith('object{') || type === 'object') {
    return '{}';
  }
  if (type === 'integer' || type.startsWith('integer(') || type === 'number') {
    return '1';
  }
  if (type === 'boolean') {
    return 'false';
  }
  return undefined;
}

/** 从 compact/OpenAPI 参数字段推导 LLM 可读 hint（无 agentMetadata 声明时的备选）。 */
export function compactParamToFormatHint(
  row: ToolParamCompact,
): ParamFormatHint | null {
  const segments: string[] = [];
  const locationHint = formatLocationHint(row.in);
  if (locationHint) {
    segments.push(locationHint);
  }
  if (row.required) {
    segments.push('required');
  }
  if (row.type?.trim()) {
    segments.push(`type=${row.type.trim()}`);
  } else if (row.format?.trim()) {
    segments.push(`format=${row.format.trim()}`);
  }
  if (row.description?.trim()) {
    segments.push(row.description.trim());
  }
  if (row.enum && row.enum.length > 0) {
    segments.push(`enum: ${row.enum.join(', ')}`);
  }
  if (segments.length === 0) {
    return null;
  }
  const example =
    row.enum?.[0] ??
    defaultExampleForType(row.type) ??
    (row.in === 'header' ? row.name : undefined);
  return example
    ? { param: row.name, hint: segments.join('; '), example }
    : { param: row.name, hint: segments.join('; ') };
}

function appendNestedHintParams(
  collector: ToolParamCompact[],
  seen: Set<string>,
  basePath: string,
  schema: Record<string, unknown>,
  location: string | undefined,
): void {
  if (!schemaHasNestedStructure(schema)) {
    return;
  }
  const nested: ToolParamCompact[] = [];
  collectNestedHintParams(schema, basePath, location, nested);
  for (const row of nested) {
    if (seen.has(row.name)) {
      continue;
    }
    seen.add(row.name);
    collector.push(row);
  }
}

function listAllCompactParamsFromInputDocument(
  inputSchema: unknown,
  fallbackSchema: unknown,
): ToolParamCompact[] {
  const document = resolveOpenApiInputDocument(inputSchema, fallbackSchema);
  if (!document) {
    return [];
  }
  const seen = new Set<string>();
  const merged: ToolParamCompact[] = [];

  const parameters = document.parameters;
  if (Array.isArray(parameters)) {
    for (const item of parameters) {
      if (!isRecord(item)) {
        continue;
      }
      const row = compactOpenApiParameter(item);
      if (!row) {
        continue;
      }
      if (seen.has(row.name)) {
        continue;
      }
      seen.add(row.name);
      merged.push(row);
      const schema = isRecord(item.schema) ? item.schema : null;
      if (schema) {
        appendNestedHintParams(merged, seen, row.name, schema, row.in);
      }
    }
  }

  const bodyProps = extractRequestBodyFromOpenApiDocument(document)?.properties ?? [];
  for (const row of bodyProps) {
    if (seen.has(row.name)) {
      continue;
    }
    seen.add(row.name);
    merged.push(row);
  }

  return merged;
}

/**
 * 合并 agentMetadata.paramFormatHints 与 inputSchema 推导 hint。
 * 同一 param：显式声明优先；未声明的 param 用 OpenAPI description/format/enum 备选。
 */
export function resolveParamFormatHints(
  inputSchema: unknown,
  fallbackSchema: unknown,
  explicitHints?: ParamFormatHint[],
): ParamFormatHint[] {
  const resolved: ParamFormatHint[] = [];
  const seen = new Set<string>();

  for (const row of listAllCompactParamsFromInputDocument(
    inputSchema,
    fallbackSchema,
  )) {
    seen.add(row.name);
    const derived = compactParamToFormatHint(row);
    if (derived) {
      resolved.push(derived);
    }
  }

  for (const hint of explicitHints ?? []) {
    if (!seen.has(hint.param)) {
      resolved.push(hint);
    }
  }

  return resolved;
}

/** 落库前从 inputSchema 同步 paramFormatHints；忽略请求体里手写的 paramFormatHints。 */
export function syncAgentMetadataParamFormatHints(
  metadata: AgentMetadata,
  inputSchema: unknown,
  fallbackSchema?: unknown,
): AgentMetadata {
  const derived = resolveParamFormatHints(inputSchema, fallbackSchema ?? null);
  if (derived.length === 0) {
    const { paramFormatHints: _removed, ...rest } = metadata;
    return rest;
  }
  return { ...metadata, paramFormatHints: derived };
}

export function normalizeAgentMetadataForPersist(
  raw: unknown,
  inputSchema: unknown,
  fallbackSchema?: unknown,
): AgentMetadata | null {
  if (!isRecord(raw)) {
    return null;
  }
  const row = { ...raw };
  delete row.paramFormatHints;
  const normalized = normalizeAgentMetadata(row);
  if (!normalized) {
    return null;
  }
  const { paramFormatHints: _removed, ...base } = normalized;
  return syncAgentMetadataParamFormatHints(base, inputSchema, fallbackSchema);
}

function enrichParamWithFormatHint(
  row: ToolParamCompact,
  hintByParam: Map<string, ParamFormatHint>,
): ToolParamCompact {
  const hint = hintByParam.get(row.name);
  if (!hint) {
    return row;
  }
  const suffix = formatParamFormatHintSuffix(hint);
  return {
    ...row,
    description: row.description
      ? `${row.description} ${suffix}`
      : suffix,
  };
}

/** 将 agentMetadata.paramFormatHints 合并进 compact 参数 description。 */
export function applyParamFormatHintsToCompactInput(
  input: CompactToolInput,
  hints: ParamFormatHint[],
): CompactToolInput {
  if (hints.length === 0) {
    return input;
  }
  const hintByParam = new Map(hints.map((row) => [row.param, row]));
  return {
    ...input,
    parameters: input.parameters.map((row) =>
      enrichParamWithFormatHint(row, hintByParam),
    ),
    requestBody: input.requestBody
      ? {
          ...input.requestBody,
          properties: input.requestBody.properties?.map((row) =>
            enrichParamWithFormatHint(row, hintByParam),
          ),
        }
      : input.requestBody,
  };
}

/**
 * Build compact `{ parameters, requestBody }` for decision-loop tool cards.
 * agentMetadata.businessFields boosts optional param ranking in the list order.
 */
export function buildCompactToolInput(
  inputSchema: unknown,
  fallbackSchema: unknown,
  agentMetadata: unknown,
): CompactToolInput {
  const document = resolveOpenApiInputDocument(inputSchema, fallbackSchema);
  if (!document) {
    return { parameters: [], requestBody: null };
  }

  const all = extractParametersFromOpenApiDocument(document);
  const requestBody = extractRequestBodyFromOpenApiDocument(document);

  if (all.length === 0 && !requestBody) {
    return { parameters: [], requestBody: requestBody ?? null };
  }

  const meta = parseAgentMetadata(agentMetadata);
  const businessFields = meta?.businessFields ?? [];

  const required = all.filter((row) => row.required);
  const optional = prioritizeOptionalParams(
    all.filter((row) => !row.required),
    businessFields,
  );

  return finalizeCompactToolInput(
    {
      parameters: [...required, ...optional],
      requestBody: requestBody ?? null,
    },
    meta,
    inputSchema,
    fallbackSchema,
  );
}

function finalizeCompactToolInput(
  compact: CompactToolInput,
  meta: ReturnType<typeof parseAgentMetadata>,
  inputSchema: unknown,
  fallbackSchema: unknown,
): CompactToolInput {
  const hints = resolveParamFormatHints(
    inputSchema,
    fallbackSchema,
    meta?.paramFormatHints,
  );
  return hints.length > 0
    ? applyParamFormatHintsToCompactInput(compact, hints)
    : compact;
}

export function listRequiredParamNames(input: CompactToolInput): string[] {
  const fromParameters = input.parameters
    .filter((row) => row.required)
    .map((row) => row.name);
  const fromBody =
    input.requestBody?.properties
      ?.filter((row) => row.required)
      .map((row) => row.name) ?? [];
  return [...new Set([...fromParameters, ...fromBody])];
}
