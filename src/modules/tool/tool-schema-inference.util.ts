import type { LlmService } from '../../core/llm/llm.service';
import {
  inferFieldDescription,
  inferFieldLabel,
  type InferFieldContext,
} from '../../core/tool-engine/field-description.util';
import { parseResponseProfile } from '../../core/tool-engine/tool-output-projection.util';
import {
  assertValidResponseProfile,
  RESPONSE_PROFILE_LIST_PATH_CANDIDATES,
} from '../../core/tool-engine/tool-response-profile.spec.util';
import type { ToolResponseProfile } from '../../core/tool-engine/tool-response-profile.types';

const CORE_FIELD_CANDIDATES = [
  'id',
  'code',
  'message',
  'success',
  'name',
  'title',
  'status',
  'state',
  'type',
  'createdAt',
  'updatedAt',
  'gmtCreate',
  'gmtModify',
];

type InferSchemasInput = {
  toolName: string;
  toolDescription: string;
  method: string;
  path: string;
  httpStatus: number;
  sampleData: unknown;
  hint?: string;
};

export type InferredToolSchemas = {
  outputSchema: Record<string, unknown>;
  responseProfile: ToolResponseProfile;
  source: 'llm' | 'fallback';
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFieldContext(input: InferSchemasInput): InferFieldContext {
  return {
    toolName: input.toolName,
    toolDescription: input.toolDescription,
  };
}

function truncateSample(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return '[truncated]';
  }
  if (Array.isArray(value)) {
    return value.slice(0, 2).map((item) => truncateSample(item, depth + 1));
  }
  if (isRecord(value)) {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      next[key] = truncateSample(item, depth + 1);
    }
    return next;
  }
  if (typeof value === 'string' && value.length > 200) {
    return `${value.slice(0, 200)}…`;
  }
  return value;
}

function inferJsonSchemaFromSample(
  value: unknown,
  fieldName?: string,
  context?: InferFieldContext,
): Record<string, unknown> {
  if (value === null) {
    const schema: Record<string, unknown> = { type: 'null' };
    if (fieldName) {
      schema.description = inferFieldDescription(fieldName, value, context);
    }
    return schema;
  }
  if (Array.isArray(value)) {
    const schema: Record<string, unknown> = {
      type: 'array',
      items:
        value.length > 0
          ? inferJsonSchemaFromSample(value[0], undefined, context)
          : { type: 'object' },
    };
    if (fieldName) {
      schema.description = inferFieldDescription(fieldName, value, context);
    }
    return schema;
  }
  if (isRecord(value)) {
    const properties: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      properties[key] = inferJsonSchemaFromSample(item, key, context);
    }
    const schema: Record<string, unknown> = { type: 'object', properties };
    if (fieldName) {
      schema.description = inferFieldDescription(fieldName, value, context);
    }
    return schema;
  }
  if (typeof value === 'number') {
    const schema: Record<string, unknown> = Number.isInteger(value)
      ? { type: 'integer' }
      : { type: 'number' };
    if (fieldName) {
      schema.description = inferFieldDescription(fieldName, value, context);
    }
    return schema;
  }
  if (typeof value === 'boolean') {
    const schema: Record<string, unknown> = { type: 'boolean' };
    if (fieldName) {
      schema.description = inferFieldDescription(fieldName, value, context);
    }
    return schema;
  }
  const schema: Record<string, unknown> = { type: 'string' };
  if (fieldName) {
    schema.description = inferFieldDescription(fieldName, value, context);
  }
  return schema;
}

function enrichSchemaNode(
  schema: Record<string, unknown>,
  sample: unknown,
  fieldName: string,
  context: InferFieldContext,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...schema };
  const description = next.description;
  if (typeof description !== 'string' || description.trim().length === 0) {
    next.description = inferFieldDescription(fieldName, sample, context);
  }

  if (next.type === 'object' && isRecord(next.properties)) {
    const properties: Record<string, unknown> = {
      ...(next.properties as Record<string, unknown>),
    };
    for (const [key, propSchema] of Object.entries(properties)) {
      if (!isRecord(propSchema)) {
        continue;
      }
      const childSample = isRecord(sample) ? sample[key] : undefined;
      properties[key] = enrichSchemaNode(propSchema, childSample, key, context);
    }
    next.properties = properties;
  }

  if (next.type === 'array' && isRecord(next.items)) {
    const sampleItem = Array.isArray(sample) ? sample[0] : undefined;
    next.items = enrichSchemaNode(
      next.items as Record<string, unknown>,
      sampleItem,
      fieldName,
      context,
    );
  }

  return next;
}

function enrichOutputSchema(
  outputSchema: Record<string, unknown>,
  sampleData: unknown,
  context: InferFieldContext,
): Record<string, unknown> {
  const enriched: Record<string, unknown> = {};
  for (const [statusCode, responseSpec] of Object.entries(outputSchema)) {
    if (!isRecord(responseSpec)) {
      enriched[statusCode] = responseSpec;
      continue;
    }
    const nextSpec: Record<string, unknown> = { ...responseSpec };
    if (isRecord(nextSpec.schema)) {
      nextSpec.schema = enrichSchemaNode(
        nextSpec.schema as Record<string, unknown>,
        sampleData,
        'response',
        context,
      );
    }
    if (
      typeof nextSpec.description !== 'string' ||
      nextSpec.description.trim().length === 0
    ) {
      nextSpec.description = '接口成功响应体';
    }
    enriched[statusCode] = nextSpec;
  }
  return enriched;
}

function buildOutputSchema(
  httpStatus: number,
  sampleData: unknown,
  context: InferFieldContext,
): Record<string, unknown> {
  return {
    [String(httpStatus)]: {
      description: '接口成功响应体',
      schema: inferJsonSchemaFromSample(sampleData, 'response', context),
    },
  };
}

function getByPath(root: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = root;
  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function collectLeafPaths(
  value: unknown,
  prefix = '',
  depth = 0,
  acc: string[] = [],
): string[] {
  if (depth > 3) {
    return acc;
  }
  if (Array.isArray(value)) {
    if (prefix) {
      acc.push(prefix);
    }
    if (value.length > 0 && isRecord(value[0])) {
      for (const key of Object.keys(value[0]).slice(0, 30)) {
        collectLeafPaths(
          value[0][key],
          prefix ? `${prefix}.${key}` : key,
          depth + 1,
          acc,
        );
      }
    }
    return acc;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const nextPath = prefix ? `${prefix}.${key}` : key;
      if (item !== null && typeof item === 'object') {
        collectLeafPaths(item, nextPath, depth + 1, acc);
      } else {
        acc.push(nextPath);
      }
    }
    return acc;
  }
  if (prefix) {
    acc.push(prefix);
  }
  return acc;
}

function detectListPath(sampleData: unknown): string | undefined {
  for (const candidate of RESPONSE_PROFILE_LIST_PATH_CANDIDATES) {
    const value = getByPath(sampleData, candidate);
    if (Array.isArray(value)) {
      return candidate;
    }
  }
  return undefined;
}

function buildFieldSpec(
  path: string,
  sampleRoot: unknown,
  context: InferFieldContext,
): {
  path: string;
  label: string;
  description: string;
  keywords: string[];
} {
  const fieldKey = path.split('.').pop() ?? path;
  const sampleValue = getByPath(sampleRoot, path);
  return {
    path,
    label: inferFieldLabel(fieldKey),
    description: inferFieldDescription(fieldKey, sampleValue, context),
    keywords: [inferFieldLabel(fieldKey), fieldKey],
  };
}

function buildFallbackResponseProfile(
  sampleData: unknown,
  context: InferFieldContext,
): ToolResponseProfile {
  const listPath = detectListPath(sampleData);
  const sampleRoot =
    listPath != null
      ? (getByPath(sampleData, listPath) as unknown[])[0]
      : sampleData;
  const paths = collectLeafPaths(sampleRoot ?? sampleData);
  const normalizedPaths = [...new Set(paths)];

  const corePaths = normalizedPaths.filter((path) => {
    const last = path.split('.').pop() ?? path;
    return CORE_FIELD_CANDIDATES.includes(last);
  });
  const fallbackCore =
    corePaths.length > 0 ? corePaths : normalizedPaths.slice(0, 8);

  const coreSet = new Set(fallbackCore);
  const optionalPaths = normalizedPaths.filter((path) => !coreSet.has(path));

  const profile: ToolResponseProfile = {
    coreFields: fallbackCore.map((path) =>
      buildFieldSpec(path, sampleRoot ?? sampleData, context),
    ),
    optionalFields: optionalPaths.slice(0, 20).map((path) =>
      buildFieldSpec(path, sampleRoot ?? sampleData, context),
    ),
    arrayLimits: listPath
      ? {
          [listPath.split('.').filter(Boolean).pop() ?? 'data']: 5,
        }
      : undefined,
    listPath,
    listMetaFields: listPath
      ? ['total', 'page', 'pageSize', 'pages']
          .map((key) => buildFieldSpec(key, sampleData, context))
          .filter((field) => getByPath(sampleData, field.path) !== undefined)
      : undefined,
  };

  const parsed = parseResponseProfile(profile);
  if (!parsed) {
    return assertValidResponseProfile(
      {
        coreFields: [
          {
            path: 'value',
            label: '结果',
            description: '接口返回结果',
          },
        ],
      },
      sampleData,
    );
  }
  return assertValidResponseProfile(parsed, sampleData);
}

function enrichResponseProfile(
  profile: ToolResponseProfile,
  sampleData: unknown,
  context: InferFieldContext,
): ToolResponseProfile {
  const listPath = profile.listPath;
  const sampleRoot =
    listPath != null
      ? (getByPath(sampleData, listPath) as unknown[] | undefined)?.[0]
      : sampleData;

  const enrichFields = (
    fields: ToolResponseProfile['coreFields'],
  ): ToolResponseProfile['coreFields'] =>
    fields.map((field) => {
      const fieldKey = field.path.split('.').pop() ?? field.path;
      const sampleValue = getByPath(sampleRoot ?? sampleData, field.path);
      return {
        ...field,
        label: field.label?.trim() || inferFieldLabel(fieldKey),
        description:
          field.description?.trim() ||
          inferFieldDescription(fieldKey, sampleValue, context),
      };
    });

  return {
    ...profile,
    coreFields: enrichFields(profile.coreFields),
    optionalFields: profile.optionalFields
      ? enrichFields(profile.optionalFields)
      : undefined,
    listMetaFields: profile.listMetaFields
      ? enrichFields(profile.listMetaFields)
      : undefined,
  };
}

function extractJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
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

function buildFallbackSchemas(input: InferSchemasInput): InferredToolSchemas {
  const context = toFieldContext(input);
  return {
    outputSchema: buildOutputSchema(
      input.httpStatus,
      input.sampleData,
      context,
    ),
    responseProfile: buildFallbackResponseProfile(input.sampleData, context),
    source: 'fallback',
  };
}

function finalizeInferredSchemas(
  outputSchema: Record<string, unknown>,
  responseProfile: ToolResponseProfile,
  input: InferSchemasInput,
  source: 'llm' | 'fallback',
): InferredToolSchemas {
  const context = toFieldContext(input);
  const enriched = enrichResponseProfile(
    responseProfile,
    input.sampleData,
    context,
  );
  return {
    outputSchema: enrichOutputSchema(
      outputSchema,
      input.sampleData,
      context,
    ),
    responseProfile: assertValidResponseProfile(enriched, input.sampleData),
    source,
  };
}

export async function inferToolSchemasFromSample(
  llmService: LlmService,
  input: InferSchemasInput,
  systemPrompt: string,
): Promise<InferredToolSchemas> {
  const fallback = buildFallbackSchemas(input);
  const sample = truncateSample(input.sampleData);

  try {
    const result = await llmService.chat({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            `toolName: ${input.toolName}`,
            `description: ${input.toolDescription}`,
            `method: ${input.method}`,
            `path: ${input.path}`,
            `httpStatus: ${input.httpStatus}`,
            input.hint ? `hint: ${input.hint}` : null,
            `sample: ${JSON.stringify(sample)}`,
          ]
            .filter((line): line is string => line != null)
            .join('\n'),
        },
      ],
      temperature: 0.2,
      maxTokens: 4096,
      stream: false,
    });

    const parsed = extractJsonObject(result.content ?? '');
    if (!parsed) {
      return finalizeInferredSchemas(
        fallback.outputSchema,
        fallback.responseProfile,
        input,
        'fallback',
      );
    }

    const outputSchema = isRecord(parsed.outputSchema)
      ? parsed.outputSchema
      : fallback.outputSchema;
    const responseProfile =
      parseResponseProfile(parsed.responseProfile) ?? fallback.responseProfile;

    return finalizeInferredSchemas(
      outputSchema,
      responseProfile,
      input,
      'llm',
    );
  } catch {
    return finalizeInferredSchemas(
      fallback.outputSchema,
      fallback.responseProfile,
      input,
      'fallback',
    );
  }
}
