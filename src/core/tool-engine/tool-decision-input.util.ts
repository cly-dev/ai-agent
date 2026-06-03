import { parseAgentMetadata } from './tool-agent-metadata.util';

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

const PARAM_DESCRIPTION_MAX = 160;
/** Include every parameter in detail up to this count (e.g. S02S004 ≈ 42). */
const FULL_DETAIL_PARAM_LIMIT = 56;
const DEFAULT_MAX_DETAILED_OPTIONAL = 32;
const MAX_BODY_PROPERTIES = 16;

const FILTER_PARAM_HINT_RE =
  /\b(stock|inventory|price|min|max|page|size|sort|status|id|sku|barcode|category|brand|filter|search|query|range|between|date|time)\b/i;

function truncateText(value: string | undefined, max: number): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max)}…`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readFormat(param: Record<string, unknown>): string | undefined {
  return typeof param.format === 'string' && param.format.trim().length > 0
    ? param.format.trim()
    : undefined;
}

function readParamType(param: Record<string, unknown>): string | undefined {
  const schema = param.schema;
  if (isRecord(schema) && typeof schema.type === 'string') {
    if (schema.type === 'array' && isRecord(schema.items)) {
      const itemType = schema.items.type;
      return typeof itemType === 'string' ? `array<${itemType}>` : 'array';
    }
    return schema.type;
  }
  const type = param.type;
  if (typeof type === 'string') {
    if (type === 'array' && isRecord(param.items)) {
      const itemType = param.items.type;
      return typeof itemType === 'string' ? `array<${itemType}>` : 'array';
    }
    return type;
  }
  return undefined;
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
  return values.slice(0, 12).map((item) => String(item));
}

function flattenInlineSchemaProperties(
  schema: Record<string, unknown>,
  requiredSet: Set<string>,
  limit: number,
): ToolParamCompact[] {
  const properties = schema.properties;
  if (!isRecord(properties)) {
    return [];
  }
  const rows: ToolParamCompact[] = [];
  for (const [name, raw] of Object.entries(properties)) {
    if (!isRecord(raw)) {
      continue;
    }
    rows.push({
      name,
      required: requiredSet.has(name),
      in: 'body',
      type: typeof raw.type === 'string' ? raw.type : undefined,
      format: readFormat(raw),
      description: truncateText(
        typeof raw.description === 'string' ? raw.description : undefined,
        PARAM_DESCRIPTION_MAX,
      ),
      enum: readEnum(raw),
      schemaRef: readSchemaRef(raw),
    });
    if (rows.length >= limit) {
      break;
    }
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
      description: truncateText(
        typeof item.description === 'string' ? item.description : undefined,
        PARAM_DESCRIPTION_MAX,
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
    description: truncateText(
      typeof item.description === 'string' ? item.description : undefined,
      PARAM_DESCRIPTION_MAX,
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

  const description = truncateText(
    typeof requestBody.description === 'string'
      ? requestBody.description
      : undefined,
    PARAM_DESCRIPTION_MAX,
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
  const properties = flattenInlineSchemaProperties(
    schema,
    requiredSet,
    MAX_BODY_PROPERTIES,
  );

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
  if (FILTER_PARAM_HINT_RE.test(param.name)) {
    score += 40;
  }
  if (FILTER_PARAM_HINT_RE.test(param.description ?? '')) {
    score += 20;
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

/**
 * Build compact `{ parameters, requestBody }` for decision-loop tool cards.
 * agentMetadata.businessFields boosts optional param ranking when truncation is needed.
 */
export function buildCompactToolInput(
  inputSchema: unknown,
  fallbackSchema: unknown,
  agentMetadata: unknown,
  maxDetailedOptional = DEFAULT_MAX_DETAILED_OPTIONAL,
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

  if (all.length <= FULL_DETAIL_PARAM_LIMIT) {
    return {
      parameters: [...required, ...optional],
      requestBody: requestBody ?? null,
    };
  }

  if (optional.length <= maxDetailedOptional) {
    return {
      parameters: [...required, ...optional],
      requestBody: requestBody ?? null,
    };
  }

  const detailedOptional = optional.slice(0, maxDetailedOptional);
  const restOptional = optional.slice(maxDetailedOptional).map((row) => row.name);
  return {
    parameters: [...required, ...detailedOptional],
    requestBody: requestBody ?? null,
    optionalParamNames: restOptional,
  };
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
