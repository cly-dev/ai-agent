import { z } from 'zod';

/** 将已归一化的 JSON Schema object 转为 Zod，供 LangChain `tool({ schema })` 使用。 */
export function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const type = schema.type;
  if (type === 'object') {
    return jsonSchemaObjectToZod(schema);
  }
  return jsonSchemaPropertyToZod(schema);
}

function jsonSchemaObjectToZod(schema: Record<string, unknown>): z.ZodObject {
  const properties = schema.properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return z.object({}).strict();
  }

  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((item): item is string => typeof item === 'string')
      : [],
  );

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, propSchema] of Object.entries(
    properties as Record<string, unknown>,
  )) {
    if (!propSchema || typeof propSchema !== 'object' || Array.isArray(propSchema)) {
      shape[key] = z.unknown().optional();
      continue;
    }
    let field = jsonSchemaPropertyToZod(propSchema as Record<string, unknown>);
    if (!required.has(key)) {
      field = field.optional();
    }
    shape[key] = field;
  }

  return z.object(shape).strict();
}

function jsonSchemaPropertyToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    return applyDescription(wrapEnum(enumValues), schema);
  }

  const type = typeof schema.type === 'string' ? schema.type : 'string';

  switch (type) {
    case 'integer': {
      return applyDescription(z.coerce.number().int(), schema);
    }
    case 'number': {
      return applyDescription(z.coerce.number(), schema);
    }
    case 'boolean': {
      return applyDescription(z.coerce.boolean(), schema);
    }
    case 'array': {
      const items = schema.items;
      const itemSchema =
        items && typeof items === 'object' && !Array.isArray(items)
          ? jsonSchemaPropertyToZod(items as Record<string, unknown>)
          : z.unknown();
      return applyDescription(z.array(itemSchema), schema);
    }
    case 'object': {
      return applyDescription(jsonSchemaObjectToZod(schema), schema);
    }
    case 'string':
    default: {
      return applyDescription(z.string(), schema);
    }
  }
}

function wrapEnum(values: unknown[]): z.ZodTypeAny {
  if (values.every((item) => typeof item === 'string') && values.length > 0) {
    return z.enum(values as [string, ...string[]]);
  }
  if (values.every((item) => typeof item === 'number') && values.length > 0) {
    return z.union(
      values.map((item) => z.literal(item as number)) as [
        z.ZodLiteral<number>,
        z.ZodLiteral<number>,
        ...z.ZodLiteral<number>[],
      ],
    );
  }
  if (values.every((item) => typeof item === 'boolean') && values.length > 0) {
    return z.union(
      values.map((item) => z.literal(item as boolean)) as [
        z.ZodLiteral<boolean>,
        z.ZodLiteral<boolean>,
        ...z.ZodLiteral<boolean>[],
      ],
    );
  }
  return z.unknown();
}

function applyDescription<T extends z.ZodTypeAny>(
  field: T,
  schema: Record<string, unknown>,
): T {
  const description = schema.description;
  if (typeof description === 'string' && description.trim().length > 0) {
    return field.describe(description.trim()) as T;
  }
  return field;
}
