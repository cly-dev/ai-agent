import type {
  ProjectedToolOutput,
  ToolResponseFieldSpec,
  ToolResponseProfile,
} from './tool-response-profile.types';
import { parseConfiguredToolDecisionRole } from './tool-decision-role.enum';

const DEFAULT_ARRAY_LIMIT = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeQuestion(text: string): string {
  return text.trim().toLowerCase();
}

function fieldMatchesQuestion(
  field: ToolResponseFieldSpec,
  userQuestion: string,
): boolean {
  const normalized = normalizeQuestion(userQuestion);
  if (!normalized) {
    return false;
  }
  return (field.keywords ?? []).some((keyword) =>
    normalized.includes(keyword.trim().toLowerCase()),
  );
}

function getByPath(root: unknown, path: string): unknown {
  if (!path.trim()) {
    return root;
  }
  return walkPathSegments(root, path.split('.').filter(Boolean), 0);
}

/**
 * 按 path 取值：中间节点是 object 则按 key 下钻；是 array 则对每项继续取剩余 path。
 */
function walkPathSegments(
  current: unknown,
  segments: string[],
  index: number,
): unknown {
  if (index >= segments.length) {
    return current;
  }
  if (current == null) {
    return undefined;
  }
  if (Array.isArray(current)) {
    const mapped = current
      .map((item) => walkPathSegments(item, segments, index))
      .filter((item) => item !== undefined);
    return mapped.length > 0 ? mapped : undefined;
  }
  if (!isRecord(current)) {
    return undefined;
  }
  return walkPathSegments(current[segments[index]!], segments, index + 1);
}

function setByPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    return;
  }
  let current: Record<string, unknown> = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const next = current[segment];
    if (!isRecord(next)) {
      const created: Record<string, unknown> = {};
      current[segment] = created;
      current = created;
      continue;
    }
    current = next;
  }
  current[segments[segments.length - 1]] = value;
}

function applyEnumLabel(
  value: unknown,
  enumLabels?: Record<string, string>,
): unknown {
  if (!enumLabels || value === null || value === undefined) {
    return value;
  }
  const key = String(value);
  return enumLabels[key] ?? value;
}

function limitArray(value: unknown, limit: number): unknown {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.slice(0, Math.max(1, limit));
}

function resolveArrayLimit(
  path: string,
  arrayLimits: Record<string, number>,
): number | undefined {
  const segments = path.split('.').filter(Boolean);
  const lastSegment = segments[segments.length - 1] ?? path;
  return (
    arrayLimits[path] ??
    arrayLimits[lastSegment] ??
    (segments.length > 1 ? arrayLimits[segments[0]!] : undefined)
  );
}

function applyFieldValue(
  field: ToolResponseFieldSpec,
  rawValue: unknown,
  arrayLimits: Record<string, number>,
): unknown {
  const limit = resolveArrayLimit(field.path, arrayLimits);
  let value = rawValue;
  if (limit != null && Array.isArray(value)) {
    value = limitArray(value, limit);
  }
  return applyEnumLabel(value, field.enumLabels);
}

function pickScalarOrNestedObjectFields(
  source: Record<string, unknown>,
  fields: ToolResponseFieldSpec[],
  arrayLimits: Record<string, number>,
  result: Record<string, unknown>,
): void {
  for (const field of fields) {
    const rawValue = getByPath(source, field.path);
    if (rawValue === undefined) {
      continue;
    }
    setByPath(result, field.path, applyFieldValue(field, rawValue, arrayLimits));
  }
}

function pickFieldsOnObject(
  source: unknown,
  fields: ToolResponseFieldSpec[],
  arrayLimits: Record<string, number>,
): Record<string, unknown> {
  if (!isRecord(source)) {
    return {};
  }

  const scalarFields: ToolResponseFieldSpec[] = [];
  const arrayFieldGroups = new Map<string, ToolResponseFieldSpec[]>();

  for (const field of fields) {
    const segments = field.path.split('.').filter(Boolean);
    if (segments.length <= 1) {
      scalarFields.push(field);
      continue;
    }
    const headKey = segments[0]!;
    const headValue = source[headKey];
    if (Array.isArray(headValue)) {
      const group = arrayFieldGroups.get(headKey) ?? [];
      group.push(field);
      arrayFieldGroups.set(headKey, group);
      continue;
    }
    scalarFields.push(field);
  }

  const result: Record<string, unknown> = {};
  pickScalarOrNestedObjectFields(source, scalarFields, arrayLimits, result);

  for (const [arrayKey, groupFields] of arrayFieldGroups) {
    const rows = source[arrayKey];
    if (!Array.isArray(rows)) {
      continue;
    }

    const limit =
      arrayLimits[arrayKey] ??
      arrayLimits.list ??
      arrayLimits.data ??
      DEFAULT_ARRAY_LIMIT;
    const sliced = rows.slice(0, Math.max(1, limit));
    const prefix = `${arrayKey}.`;
    result[arrayKey] = sliced.map((row) => {
      const relativeFields = groupFields.map((field) => ({
        ...field,
        path: field.path.startsWith(prefix)
          ? field.path.slice(prefix.length)
          : field.path,
      }));
      return pickFieldsOnObject(row, relativeFields, arrayLimits);
    });
  }

  return result;
}

function collectSelectedFields(
  profile: ToolResponseProfile,
  userQuestion: string,
): ToolResponseFieldSpec[] {
  const selected = [...profile.coreFields];
  const seen = new Set(selected.map((field) => field.path));
  for (const field of profile.optionalFields ?? []) {
    if (seen.has(field.path)) {
      continue;
    }
    if (fieldMatchesQuestion(field, userQuestion)) {
      selected.push(field);
      seen.add(field.path);
    }
  }
  return selected;
}

function buildFieldMetadata(fields: ToolResponseFieldSpec[]): {
  fieldLabels: Record<string, string>;
  fieldDescriptions: Record<string, string>;
  enumLabelsByPath: Record<string, Record<string, string>>;
} {
  const fieldLabels: Record<string, string> = {};
  const fieldDescriptions: Record<string, string> = {};
  const enumLabelsByPath: Record<string, Record<string, string>> = {};
  for (const field of fields) {
    fieldLabels[field.path] = field.label;
    if (field.description?.trim()) {
      fieldDescriptions[field.path] = field.description.trim();
    }
    if (field.enumLabels && Object.keys(field.enumLabels).length > 0) {
      enumLabelsByPath[field.path] = field.enumLabels;
    }
  }
  return { fieldLabels, fieldDescriptions, enumLabelsByPath };
}

/** 解析 Tool.responseProfile JSON。 */
export function parseResponseProfile(
  raw: unknown,
): ToolResponseProfile | null {
  if (!isRecord(raw)) {
    return null;
  }
  const coreFieldsRaw = raw.coreFields;
  if (!Array.isArray(coreFieldsRaw) || coreFieldsRaw.length === 0) {
    return null;
  }
  const normalizeField = (item: unknown): ToolResponseFieldSpec | null => {
    if (!isRecord(item)) {
      return null;
    }
    const path = typeof item.path === 'string' ? item.path.trim() : '';
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    if (!path || !label) {
      return null;
    }
    const keywords = Array.isArray(item.keywords)
      ? item.keywords.filter((kw): kw is string => typeof kw === 'string')
      : undefined;
    const enumLabels = isRecord(item.enumLabels)
      ? Object.fromEntries(
          Object.entries(item.enumLabels).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : undefined;
    const description =
      typeof item.description === 'string' ? item.description.trim() : undefined;
    return {
      path,
      label,
      description: description || undefined,
      keywords,
      enumLabels:
        enumLabels && Object.keys(enumLabels).length > 0
          ? enumLabels
          : undefined,
    };
  };

  const coreFields = coreFieldsRaw
    .map(normalizeField)
    .filter((field): field is ToolResponseFieldSpec => field != null);
  if (coreFields.length === 0) {
    return null;
  }

  const optionalFields = Array.isArray(raw.optionalFields)
    ? raw.optionalFields
        .map(normalizeField)
        .filter((field): field is ToolResponseFieldSpec => field != null)
    : undefined;

  const arrayLimits = isRecord(raw.arrayLimits)
    ? Object.fromEntries(
        Object.entries(raw.arrayLimits).filter(
          (entry): entry is [string, number] => typeof entry[1] === 'number',
        ),
      )
    : undefined;

  const listPath =
    typeof raw.listPath === 'string' && raw.listPath.trim()
      ? raw.listPath.trim()
      : undefined;

  const listMetaFields = Array.isArray(raw.listMetaFields)
    ? raw.listMetaFields
        .map(normalizeField)
        .filter((field): field is ToolResponseFieldSpec => field != null)
    : undefined;

  const decisionRole = parseConfiguredToolDecisionRole(raw.decisionRole);

  return {
    coreFields,
    optionalFields,
    arrayLimits,
    listPath,
    listMetaFields,
    decisionRole,
  };
}

/**
 * 按 responseProfile 裁剪工具原始响应。
 * 无 profile 时原样返回。
 */
export function projectToolOutput(
  raw: unknown,
  userQuestion: string,
  profile: ToolResponseProfile | null,
): ProjectedToolOutput {
  if (!profile) {
    return {
      data: raw,
      fieldLabels: {},
      fieldDescriptions: {},
      enumLabelsByPath: {},
    };
  }

  const arrayLimits = profile.arrayLimits ?? {};
  const selectedFields = collectSelectedFields(profile, userQuestion);
  const { fieldLabels, fieldDescriptions, enumLabelsByPath } =
    buildFieldMetadata(selectedFields);

  if (profile.listPath) {
    const listValue = getByPath(raw, profile.listPath);
    const listLimit =
      arrayLimits[profile.listPath.split('.').pop() ?? profile.listPath] ??
      arrayLimits.list ??
      DEFAULT_ARRAY_LIMIT;
    const sourceRows = Array.isArray(listValue) ? listValue : [];
    const rows = sourceRows.slice(0, Math.max(1, listLimit));

    const projectedRows = rows.map((row) =>
      pickFieldsOnObject(row, selectedFields, arrayLimits),
    );

    const container: Record<string, unknown> = {};
    setByPath(container, profile.listPath, projectedRows);

    for (const metaField of profile.listMetaFields ?? []) {
      const metaValue = getByPath(raw, metaField.path);
      if (metaValue !== undefined) {
        const projectedMeta = applyEnumLabel(metaValue, metaField.enumLabels);
        setByPath(container, metaField.path, projectedMeta);
        fieldLabels[metaField.path] = metaField.label;
        if (metaField.description?.trim()) {
          fieldDescriptions[metaField.path] = metaField.description.trim();
        }
        if (metaField.enumLabels) {
          enumLabelsByPath[metaField.path] = metaField.enumLabels;
        }
      }
    }

    return {
      data: container,
      fieldLabels,
      fieldDescriptions,
      enumLabelsByPath,
    };
  }

  const data = pickFieldsOnObject(raw, selectedFields, arrayLimits);
  return { data, fieldLabels, fieldDescriptions, enumLabelsByPath };
}

/** 将字段说明格式化为 summarize prompt 片段。 */
export function formatFieldLabelsForPrompt(
  fieldLabels: Record<string, string>,
  enumLabelsByPath: Record<string, Record<string, string>>,
  fieldDescriptions: Record<string, string> = {},
): string {
  const lines = Object.entries(fieldLabels).map(([path, label]) => {
    const description = fieldDescriptions[path];
    const enumLabels = enumLabelsByPath[path];
    const labelPart = description && description !== label
      ? `${label}：${description}`
      : label;
    if (!enumLabels) {
      return `- ${path}: ${labelPart}`;
    }
    const enumText = Object.entries(enumLabels)
      .map(([value, text]) => `${value}=${text}`)
      .join(', ');
    return `- ${path}: ${labelPart}（${enumText}）`;
  });
  return lines.join('\n');
}
