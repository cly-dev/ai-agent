import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  ProjectedToolOutput,
  ToolResponseFieldSpec,
  ToolResponseProfile,
} from './tool-response-profile.types';

const DEFAULT_ARRAY_LIMIT = 5;
const DEBUG_JSON_MAX_CHARS = 6000;

export type ProjectToolOutputDebugContext = {
  sessionId?: string;
  runId?: number;
  toolName?: string;
  iteration?: number;
};

type ProjectionDebugStep = {
  step: number;
  name: string;
  detail: Record<string, unknown>;
};

class ProjectionDebugLog {
  private readonly steps: ProjectionDebugStep[] = [];
  private seq = 0;

  add(name: string, detail: Record<string, unknown>): void {
    this.seq += 1;
    this.steps.push({ step: this.seq, name, detail });
  }

  flush(context: ProjectToolOutputDebugContext | undefined): string | null {
    if (!isProjectionDebugEnabled() || this.steps.length === 0) {
      return null;
    }
    try {
      const dir = resolveProjectionDebugDir(context);
      fs.mkdirSync(dir, { recursive: true });
      const sessionHint = sanitizeFileHint(context?.sessionId ?? 'unknown');
      const runHint = context?.runId ?? 0;
      const toolHint = sanitizeFileHint(context?.toolName ?? 'tool');
      const file = path.join(
        dir,
        `${Date.now()}-run${runHint}-${toolHint}-${sessionHint}-projection.txt`,
      );
      const lines = this.steps.map((item) => {
        const detailText = stringifyDebugValue(item.detail);
        return `[step ${item.step}] ${item.name}\n${detailText}`;
      });
      const body = [
        `# tool output projection debug`,
        `at: ${new Date().toISOString()}`,
        `sessionId: ${context?.sessionId ?? ''}`,
        `runId: ${context?.runId ?? ''}`,
        `toolName: ${context?.toolName ?? ''}`,
        `iteration: ${context?.iteration ?? ''}`,
        '',
        ...lines,
        '',
      ].join('\n');
      fs.writeFileSync(file, body, 'utf-8');
      return file;
    } catch {
      return null;
    }
  }
}

function isProjectionDebugEnabled(): boolean {
  const value = process.env.AGENT_ENGINE_DEBUG?.trim().toLowerCase();
  if (value === '0' || value === 'false' || value === 'off') {
    return false;
  }
  if (value === '1' || value === 'true' || value === 'on') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

function sanitizeFileHint(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed.replace(/[^a-z0-9]/g, '') : 'unknown';
}

function resolveProjectionDebugDir(
  context: ProjectToolOutputDebugContext | undefined,
): string {
  const day = new Date().toISOString().slice(0, 10);
  const sessionHint = sanitizeFileHint(context?.sessionId ?? 'unknown');
  const runHint = context?.runId ?? 0;
  return path.join(
    process.cwd(),
    'logs',
    'tool-output-projection',
    day,
    `session-${sessionHint}`,
    `run-${runHint}`,
  );
}

function stringifyDebugValue(value: unknown): string {
  try {
    const text =
      typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (text.length <= DEBUG_JSON_MAX_CHARS) {
      return text;
    }
    return `${text.slice(0, DEBUG_JSON_MAX_CHARS)}\n...(truncated)`;
  } catch {
    return String(value);
  }
}

function summarizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      preview: value.slice(0, 2),
    };
  }
  if (isRecord(value)) {
    return {
      type: 'object',
      keys: Object.keys(value),
    };
  }
  return value;
}

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
): {
  value: unknown;
  arrayLimit: number | null;
  arrayLimited: boolean;
  enumApplied: boolean;
} {
  const limit = resolveArrayLimit(field.path, arrayLimits);
  let value = rawValue;
  let arrayLimited = false;
  if (limit != null && Array.isArray(value)) {
    const beforeLength = value.length;
    value = limitArray(value, limit);
    arrayLimited = beforeLength !== (value as unknown[]).length;
  }
  const beforeEnum = value;
  value = applyEnumLabel(value, field.enumLabels);
  return {
    value,
    arrayLimit: limit ?? null,
    arrayLimited,
    enumApplied: beforeEnum !== value,
  };
}

function pickScalarOrNestedObjectFields(
  source: Record<string, unknown>,
  fields: ToolResponseFieldSpec[],
  arrayLimits: Record<string, number>,
  debug: ProjectionDebugLog | undefined,
  result: Record<string, unknown>,
): void {
  for (const field of fields) {
    const rawValue = getByPath(source, field.path);
    if (rawValue === undefined) {
      debug?.add('pick_field_missing', {
        path: field.path,
        label: field.label,
        mode: 'object',
      });
      continue;
    }
    const applied = applyFieldValue(field, rawValue, arrayLimits);
    setByPath(result, field.path, applied.value);
    debug?.add('pick_field_applied', {
      path: field.path,
      label: field.label,
      mode: 'object',
      arrayLimit: applied.arrayLimit,
      arrayLimited: applied.arrayLimited,
      enumApplied: applied.enumApplied,
      rawPreview: summarizeValue(rawValue),
      projectedPreview: summarizeValue(applied.value),
    });
  }
}

function pickFieldsOnObject(
  source: unknown,
  fields: ToolResponseFieldSpec[],
  arrayLimits: Record<string, number>,
  debug?: ProjectionDebugLog,
): Record<string, unknown> {
  if (!isRecord(source)) {
    debug?.add('pick_fields_skipped', {
      reason: 'source is not object',
      sourceType: source === null ? 'null' : typeof source,
    });
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
  pickScalarOrNestedObjectFields(source, scalarFields, arrayLimits, debug, result);

  for (const [arrayKey, groupFields] of arrayFieldGroups) {
    const rows = source[arrayKey];
    if (!Array.isArray(rows)) {
      for (const field of groupFields) {
        debug?.add('pick_field_missing', {
          path: field.path,
          label: field.label,
          mode: 'array_expected',
          arrayKey,
        });
      }
      continue;
    }

    const limit =
      arrayLimits[arrayKey] ??
      arrayLimits.list ??
      arrayLimits.data ??
      DEFAULT_ARRAY_LIMIT;
    const sliced = rows.slice(0, Math.max(1, limit));
    debug?.add('array_field_group_start', {
      arrayKey,
      rowCount: rows.length,
      keptRowCount: sliced.length,
      fieldPaths: groupFields.map((field) => field.path),
    });

    const prefix = `${arrayKey}.`;
    result[arrayKey] = sliced.map((row, index) => {
      const relativeFields = groupFields.map((field) => ({
        ...field,
        path: field.path.startsWith(prefix)
          ? field.path.slice(prefix.length)
          : field.path,
      }));
      const rowPicked = pickFieldsOnObject(
        row,
        relativeFields,
        arrayLimits,
        debug,
      );
      debug?.add('array_field_row_picked', {
        arrayKey,
        index,
        projectedPreview: summarizeValue(rowPicked),
      });
      return rowPicked;
    });
  }

  return result;
}

function collectSelectedFields(
  profile: ToolResponseProfile,
  userQuestion: string,
  debug?: ProjectionDebugLog,
): ToolResponseFieldSpec[] {
  const selected = [...profile.coreFields];
  const seen = new Set(selected.map((field) => field.path));
  const matchedOptional: string[] = [];
  const skippedOptional: string[] = [];
  for (const field of profile.optionalFields ?? []) {
    if (seen.has(field.path)) {
      continue;
    }
    if (fieldMatchesQuestion(field, userQuestion)) {
      selected.push(field);
      seen.add(field.path);
      matchedOptional.push(field.path);
      continue;
    }
    skippedOptional.push(field.path);
  }
  debug?.add('select_fields', {
    userQuestion,
    coreFieldPaths: profile.coreFields.map((field) => field.path),
    matchedOptionalPaths: matchedOptional,
    skippedOptionalPaths: skippedOptional,
    selectedFieldPaths: selected.map((field) => field.path),
  });
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

  return {
    coreFields,
    optionalFields,
    arrayLimits,
    listPath,
    listMetaFields,
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
  debugContext?: ProjectToolOutputDebugContext,
): ProjectedToolOutput {
  const debug = new ProjectionDebugLog();
  debug.add('input_received', {
    userQuestion,
    hasProfile: profile != null,
    rawPreview: summarizeValue(raw),
    profile: profile
      ? {
          listPath: profile.listPath ?? null,
          arrayLimits: profile.arrayLimits ?? null,
          coreFieldPaths: profile.coreFields.map((field) => field.path),
          optionalFieldPaths:
            profile.optionalFields?.map((field) => field.path) ?? [],
        }
      : null,
  });

  if (!profile) {
    debug.add('passthrough_no_profile', {
      reason: 'responseProfile missing or invalid',
    });
    debug.flush(debugContext);
    return {
      data: raw,
      fieldLabels: {},
      fieldDescriptions: {},
      enumLabelsByPath: {},
    };
  }

  const arrayLimits = profile.arrayLimits ?? {};
  const selectedFields = collectSelectedFields(profile, userQuestion, debug);
  const { fieldLabels, fieldDescriptions, enumLabelsByPath } =
    buildFieldMetadata(selectedFields);
  debug.add('field_metadata_built', {
    fieldLabels,
    fieldDescriptions,
    enumLabelsByPath,
  });

  if (profile.listPath) {
    const listValue = getByPath(raw, profile.listPath);
    const listLimit =
      arrayLimits[profile.listPath.split('.').pop() ?? profile.listPath] ??
      arrayLimits.list ??
      DEFAULT_ARRAY_LIMIT;
    const sourceRows = Array.isArray(listValue) ? listValue : [];
    const rows = sourceRows.slice(0, Math.max(1, listLimit));
    debug.add('list_slice', {
      listPath: profile.listPath,
      listLimit,
      sourceRowCount: sourceRows.length,
      keptRowCount: rows.length,
    });

    const projectedRows = rows.map((row, index) => {
      debug.add('list_row_pick_start', { index });
      const picked = pickFieldsOnObject(row, selectedFields, arrayLimits, debug);
      debug.add('list_row_pick_done', {
        index,
        projectedPreview: summarizeValue(picked),
      });
      return picked;
    });

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
        debug.add('list_meta_field_applied', {
          path: metaField.path,
          label: metaField.label,
          rawPreview: summarizeValue(metaValue),
          projectedPreview: summarizeValue(projectedMeta),
        });
      } else {
        debug.add('list_meta_field_missing', {
          path: metaField.path,
          label: metaField.label,
        });
      }
    }

    const result = {
      data: container,
      fieldLabels,
      fieldDescriptions,
      enumLabelsByPath,
    };
    debug.add('output_final', {
      mode: 'list',
      projectedPreview: summarizeValue(result.data),
      fieldCount: Object.keys(fieldLabels).length,
    });
    debug.flush(debugContext);
    return result;
  }

  const data = pickFieldsOnObject(raw, selectedFields, arrayLimits, debug);
  const result = { data, fieldLabels, fieldDescriptions, enumLabelsByPath };
  debug.add('output_final', {
    mode: 'object',
    projectedPreview: summarizeValue(result.data),
    fieldCount: Object.keys(fieldLabels).length,
  });
  debug.flush(debugContext);
  return result;
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
