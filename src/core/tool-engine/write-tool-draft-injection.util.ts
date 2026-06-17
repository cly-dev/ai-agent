import {
  buildCompactToolInput,
  listRequiredParamNames,
  listToolInputCompactParams,
  type ToolParamCompact,
} from './tool-decision-input.util';
import { parseAgentMetadata } from './tool-agent-metadata.util';
import { collectOpenApiParameterSpecs } from './tool-input-sanitize.util';
import type { AgentChatPageContext } from '../host-bridge/page-context.types';

type WriteToolDef = {
  inputSchema?: unknown;
  schema?: unknown;
  agentMetadata?: unknown;
};

type WriteToolSubmitPaths = {
  arrayItemStringPaths: string[];
  nestedStringPaths: string[];
  topLevelStringPaths: string[];
  bodyRoot: string | null;
  identifierLeaves: Set<string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPresent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function lastPathSegment(path: string): string {
  const normalized = path.replace(/\[\]/g, '');
  const parts = normalized.split('.');
  return parts[parts.length - 1] ?? path;
}

function isStringParamType(type: string | undefined): boolean {
  if (!type) {
    return false;
  }
  const normalized = type.trim().toLowerCase();
  return normalized === 'string' || normalized.startsWith('string(');
}

function isEnumLikeParam(row: ToolParamCompact): boolean {
  return Array.isArray(row.enum) && row.enum.length > 0;
}

/** draft / submit 正文是否可用（排除空围栏、纯反引号等垃圾）。 */
export function isUsablePlanDraftSubmitText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  if (/^`+$/.test(trimmed)) {
    return false;
  }
  if (/^```[\w-]*\s*```$/.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith('```') && !/```[\s\S]+```/.test(trimmed)) {
    return false;
  }
  return true;
}

function resolveWriteToolSubmitPaths(writeTool: WriteToolDef): WriteToolSubmitPaths {
  const specs =
    collectOpenApiParameterSpecs(writeTool.inputSchema).length > 0
      ? collectOpenApiParameterSpecs(writeTool.inputSchema)
      : collectOpenApiParameterSpecs(writeTool.schema);
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const meta = parseAgentMetadata(writeTool.agentMetadata);
  const businessFields = new Set(meta?.businessFields ?? []);
  const bodyRoot = resolveBodyRootParam(specs, compactParams);
  const identifierLeaves = new Set<string>(businessFields);

  const arrayItemStringPaths: string[] = [];
  const nestedStringPaths: string[] = [];
  const topLevelStringPaths: string[] = [];

  for (const row of compactParams) {
    if (!isStringParamType(row.type)) {
      continue;
    }
    if (isEnumLikeParam(row)) {
      continue;
    }
    const leaf = lastPathSegment(row.name);
    if (businessFields.has(leaf) || businessFields.has(row.name)) {
      identifierLeaves.add(leaf);
      continue;
    }
    if (row.in && row.in !== 'body' && !row.name.includes('.')) {
      continue;
    }
    if (row.name.includes('[]')) {
      arrayItemStringPaths.push(row.name);
      continue;
    }
    if (row.name.includes('.')) {
      nestedStringPaths.push(row.name);
      continue;
    }
    if (row.in === 'body' || !row.in) {
      topLevelStringPaths.push(row.name);
    }
  }

  for (const row of compactParams) {
    if (!row.required) {
      continue;
    }
    const leaf = lastPathSegment(row.name);
    if (!isStringParamType(row.type)) {
      identifierLeaves.add(leaf);
    }
  }

  return {
    arrayItemStringPaths,
    nestedStringPaths,
    topLevelStringPaths,
    bodyRoot,
    identifierLeaves,
  };
}

function pickPrimaryWriteToolSubmitPath(
  paths: WriteToolSubmitPaths,
  compactParams: ToolParamCompact[],
): string | null {
  const candidates = [
    ...paths.arrayItemStringPaths,
    ...paths.nestedStringPaths,
    ...paths.topLevelStringPaths,
  ];
  if (candidates.length === 0) {
    return null;
  }
  const byName = new Map(compactParams.map((row) => [row.name, row]));
  const scored = candidates.map((path) => {
    const row = byName.get(path);
    let score = 0;
    if (row && !row.required) {
      score += 2;
    }
    if (row?.description) {
      score += Math.min(row.description.length, 200) / 100;
    }
    if (path.includes('[]')) {
      score += 1;
    }
    return { path, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.path ?? null;
}

function resolveBodyRootParam(
  specs: ReturnType<typeof collectOpenApiParameterSpecs>,
  compactParams: ToolParamCompact[],
): string | null {
  const bodySpec = specs.find((spec) => spec.in === 'body');
  if (bodySpec?.name) {
    return bodySpec.name;
  }
  const objectBody = compactParams.find(
    (row) => row.in === 'body' && (row.type?.startsWith('object') ?? false),
  );
  return objectBody?.name ?? null;
}

function flattenBodyScopes(
  source: Record<string, unknown>,
  bodyRoot: string | null,
): Record<string, unknown>[] {
  const scopes: Record<string, unknown>[] = [source];
  if (bodyRoot && isRecord(source[bodyRoot])) {
    scopes.push(source[bodyRoot] as Record<string, unknown>);
  }
  return scopes;
}

function findNestedValueByLeaf(
  source: Record<string, unknown>,
  leaf: string,
  bodyRoot: string | null,
): unknown {
  for (const scope of flattenBodyScopes(source, bodyRoot)) {
    if (leaf in scope && isPresent(scope[leaf])) {
      return scope[leaf];
    }
  }
  function walk(value: unknown): unknown {
    if (isRecord(value)) {
      if (leaf in value && isPresent(value[leaf])) {
        return value[leaf];
      }
      for (const nested of Object.values(value)) {
        const found = walk(nested);
        if (isPresent(found)) {
          return found;
        }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) {
        const found = walk(item);
        if (isPresent(found)) {
          return found;
        }
      }
    }
    return undefined;
  }
  return walk(source);
}

function pickIdentifierFields(
  source: Record<string, unknown>,
  paths: WriteToolSubmitPaths,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const leaf of paths.identifierLeaves) {
    const value = findNestedValueByLeaf(source, leaf, paths.bodyRoot);
    if (isPresent(value)) {
      out[leaf] = value;
    }
  }
  return out;
}

function readValueAtParamPath(
  args: Record<string, unknown>,
  path: string,
): unknown {
  const segments = path.replace(/\[\]/g, '').split('.').filter(Boolean);
  let cursor: unknown = args;
  for (const segment of segments) {
    if (!isRecord(cursor) || !(segment in cursor)) {
      return undefined;
    }
    cursor = cursor[segment];
  }
  return cursor;
}

/** 从 plan summarize 产出中提取应提交到 write API 的正文（优先 fenced code block）。 */
export function extractSubmitTextFromDraftReply(draft: string): string {
  const trimmed = draft.trim();
  if (!trimmed) {
    return '';
  }
  const fences = [...trimmed.matchAll(/```[\w-]*\n([\s\S]*?)```/g)];
  for (let i = fences.length - 1; i >= 0; i -= 1) {
    const inner = fences[i][1].trim();
    if (!inner || inner.startsWith('{') || inner.startsWith('[')) {
      continue;
    }
    return inner;
  }
  return trimmed;
}

/** 从 LLM 产出的 write arguments 中按 schema 字符串路径提取 submit 正文。 */
export function extractSubmitTextFromWriteArguments(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
): string | null {
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const paths = resolveWriteToolSubmitPaths(writeTool);
  const primaryPath = pickPrimaryWriteToolSubmitPath(paths, compactParams);
  if (!primaryPath) {
    return null;
  }
  if (primaryPath.includes('[]')) {
    const match = /^(.+)\[\]\.(.+)$/.exec(primaryPath);
    if (!match) {
      return null;
    }
    const arrayValue = readValueAtParamPath(args, match[1]);
    if (!Array.isArray(arrayValue)) {
      return null;
    }
    for (const item of arrayValue) {
      if (isRecord(item)) {
        const field = match[2];
        const text = item[field];
        if (typeof text === 'string' && text.trim()) {
          return text.trim();
        }
      }
    }
    return null;
  }
  const value = readValueAtParamPath(args, primaryPath);
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

function ensureRecordAtPath(
  root: Record<string, unknown>,
  pathParts: string[],
): Record<string, unknown> {
  let cursor: Record<string, unknown> = root;
  for (const part of pathParts) {
    const existing = cursor[part];
    const next = isRecord(existing) ? { ...existing } : {};
    cursor[part] = next;
    cursor = next;
  }
  return cursor;
}

function applyArrayItemStringDraft(
  args: Record<string, unknown>,
  path: string,
  submitText: string,
  identifierFields: Record<string, unknown>,
): void {
  const match = /^(.+)\[\]\.(.+)$/.exec(path);
  if (!match) {
    return;
  }
  const arrayPath = match[1];
  const itemField = match[2];
  const parts = arrayPath.split('.');
  const arrayKey = parts[parts.length - 1] ?? arrayPath;
  const parentParts = parts.slice(0, -1);
  const parent =
    parentParts.length > 0
      ? ensureRecordAtPath(args, parentParts)
      : args;
  const existing = parent[arrayKey];
  if (Array.isArray(existing) && existing.length > 0) {
    parent[arrayKey] = existing.map((item) => {
      if (!isRecord(item)) {
        return item;
      }
      return { ...item, [itemField]: submitText };
    });
    return;
  }
  parent[arrayKey] = [
    {
      ...identifierFields,
      [itemField]: submitText,
    },
  ];
}

function applyNestedStringDraft(
  args: Record<string, unknown>,
  path: string,
  submitText: string,
): void {
  const parts = path.split('.');
  const leaf = parts[parts.length - 1];
  const parentParts = parts.slice(0, -1);
  const parent =
    parentParts.length > 0 ? ensureRecordAtPath(args, parentParts) : args;
  parent[leaf] = submitText;
}

function applyTopLevelStringDraft(
  args: Record<string, unknown>,
  field: string,
  submitText: string,
  bodyRoot: string | null,
): void {
  if (bodyRoot) {
    const bodyValue = args[bodyRoot];
    const existing = isRecord(bodyValue) ? { ...bodyValue } : {};
    existing[field] = submitText;
    args[bodyRoot] = existing;
    return;
  }
  args[field] = submitText;
}

/** write tool schema 是否定义了需注入正文的 submit 字符串路径（如回复类）；无则为 delete/纯参数类变更。 */
export function writeToolHasSubmitBodyPath(writeTool: WriteToolDef): boolean {
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const paths = resolveWriteToolSubmitPaths(writeTool);
  return pickPrimaryWriteToolSubmitPath(paths, compactParams) != null;
}

function formatPreviewValue(value: unknown): string | null {
  if (!isPresent(value)) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatPreviewValue(item))
      .filter((item): item is string => item != null);
    return parts.length > 0 ? parts.join(', ') : null;
  }
  if (isRecord(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }
  return null;
}

/** 按 schema compact 参数将 write arguments 格式化为用户可读 Markdown（无业务字段硬编码）。 */
export function formatWriteToolArgumentsForUserPreview(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
  toolDescription?: string,
  options?: { excludeSubmitBody?: boolean },
): string {
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const submitPaths = options?.excludeSubmitBody
    ? resolveWriteToolSubmitPaths(writeTool)
    : null;
  const primarySubmitPath =
    submitPaths != null
      ? pickPrimaryWriteToolSubmitPath(
          submitPaths,
          compactParams,
        )
      : null;
  const lines: string[] = [];
  if (toolDescription?.trim() && !options?.excludeSubmitBody) {
    lines.push(toolDescription.trim());
  }
  for (const row of compactParams) {
    if (
      primarySubmitPath &&
      (row.name === primarySubmitPath ||
        row.name.startsWith(`${primarySubmitPath}.`))
    ) {
      continue;
    }
    if (row.name.includes('[]')) {
      const match = /^(.+)\[\]\.(.+)$/.exec(row.name);
      if (!match) {
        continue;
      }
      const arrayValue = readValueAtParamPath(args, match[1]);
      if (!Array.isArray(arrayValue)) {
        continue;
      }
      arrayValue.forEach((item, index) => {
        if (!isRecord(item)) {
          return;
        }
        if (
          primarySubmitPath &&
          row.name === primarySubmitPath
        ) {
          return;
        }
        const text = formatPreviewValue(item[match[2]]);
        if (text) {
          const label = row.description?.trim() || row.name;
          lines.push(`- ${label} (${index + 1}): ${text}`);
        }
      });
      continue;
    }
    const text = formatPreviewValue(readValueAtParamPath(args, row.name));
    if (!text) {
      continue;
    }
    const label = row.description?.trim() || row.name;
    lines.push(`- ${label}: ${text}`);
  }
  if (lines.length === 0) {
    return '';
  }
  return lines.join('\n');
}

/** write arguments 是否已在 schema 定义的 submit 字符串路径上包含正文。 */
export function writeToolArgsContainSubmitText(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
): boolean {
  return extractSubmitTextFromWriteArguments(args, writeTool) != null;
}

/** 按 write tool OpenAPI 结构，将 submit 正文写入 schema 定义的字符串路径。 */
export function injectDraftIntoWriteToolArguments(
  args: Record<string, unknown>,
  submitText: string,
  writeTool: WriteToolDef,
): Record<string, unknown> {
  const trimmed = submitText.trim();
  if (!trimmed) {
    return args;
  }
  const paths = resolveWriteToolSubmitPaths(writeTool);
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const primaryPath = pickPrimaryWriteToolSubmitPath(paths, compactParams);
  const next: Record<string, unknown> = JSON.parse(JSON.stringify(args));
  if (!primaryPath) {
    return next;
  }
  const identifierFields = pickIdentifierFields(next, paths);

  if (primaryPath.includes('[]')) {
    applyArrayItemStringDraft(next, primaryPath, trimmed, identifierFields);
    return next;
  }
  if (primaryPath.includes('.')) {
    applyNestedStringDraft(next, primaryPath, trimmed);
    return next;
  }
  applyTopLevelStringDraft(next, primaryPath, trimmed, paths.bodyRoot);
  return next;
}

function isPresentAtWriteToolParamPath(
  args: Record<string, unknown>,
  path: string,
): boolean {
  if (!path.includes('[]')) {
    return isPresent(readValueAtParamPath(args, path));
  }
  const match = /^(.+)\[\]\.(.+)$/.exec(path);
  if (!match) {
    return isPresent(readValueAtParamPath(args, path.replace(/\[\]/g, '')));
  }
  const arrayValue = readValueAtParamPath(args, match[1]);
  if (!Array.isArray(arrayValue) || arrayValue.length === 0) {
    return false;
  }
  const itemField = match[2];
  return arrayValue.some(
    (item) => isRecord(item) && isPresent(item[itemField]),
  );
}

export function satisfiesRequiredWriteToolArgs(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
): boolean {
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const requiredPaths = compactParams
    .filter((row) => row.required)
    .map((row) => row.name);
  if (requiredPaths.length === 0) {
    const compact = buildCompactToolInput(
      writeTool.inputSchema,
      writeTool.schema,
      writeTool.agentMetadata,
    );
    for (const name of listRequiredParamNames(compact)) {
      if (!isPresent(args[name])) {
        return false;
      }
    }
    return true;
  }
  for (const path of requiredPaths) {
    if (!isPresentAtWriteToolParamPath(args, path)) {
      return false;
    }
  }
  return true;
}

function setValueAtParamPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
  bodyRoot: string | null,
): void {
  if (path.includes('[]')) {
    const match = /^(.+)\[\]\.(.+)$/.exec(path);
    if (!match) {
      return;
    }
    const arrayPath = match[1];
    const itemField = match[2];
    const parts = arrayPath.split('.');
    const arrayKey = parts[parts.length - 1] ?? arrayPath;
    const parentParts = parts.slice(0, -1);
    const parent =
      parentParts.length > 0 ? ensureRecordAtPath(root, parentParts) : root;
    const existing = parent[arrayKey];
    if (Array.isArray(existing) && existing.length > 0) {
      parent[arrayKey] = existing.map((item) => {
        if (!isRecord(item) || isPresent(item[itemField])) {
          return item;
        }
        return { ...item, [itemField]: value };
      });
    }
    return;
  }
  if (path.includes('.')) {
    const parts = path.split('.');
    const leaf = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    const parent =
      parentParts.length > 0 ? ensureRecordAtPath(root, parentParts) : root;
    parent[leaf] = value;
    return;
  }
  if (bodyRoot) {
    const bodyValue = root[bodyRoot];
    const body = isRecord(bodyValue) ? { ...bodyValue } : {};
    body[path] = value;
    root[bodyRoot] = body;
    return;
  }
  root[path] = value;
}

function collectReadObservationRecords(
  observations: Array<{ name: string; output: unknown }>,
  isReadToolObservation: (toolName: string) => boolean,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const obs of observations) {
    if (!isReadToolObservation(obs.name)) {
      continue;
    }
    const output = obs.output;
    if (!isRecord(output) || output._agentToolError === true) {
      continue;
    }
    out.push(output);
  }
  return out;
}

function resolveReadArrayFromRecords(
  readRecords: Record<string, unknown>[],
  arrayPath: string,
): unknown[] | null {
  for (const record of readRecords) {
    const direct = readValueAtParamPath(record, arrayPath);
    if (Array.isArray(direct) && direct.length > 0) {
      return direct;
    }
    const leaf = arrayPath.split('.').pop();
    const leafValue = leaf ? record[leaf] : undefined;
    if (leaf && Array.isArray(leafValue) && leafValue.length > 0) {
      return leafValue;
    }
  }
  return null;
}

function mergeWriteArrayItemFieldsFromReadRecords(
  args: Record<string, unknown>,
  arrayPath: string,
  fields: string[],
  readRecords: Record<string, unknown>[],
): void {
  const writeArray = readValueAtParamPath(args, arrayPath);
  if (!Array.isArray(writeArray) || writeArray.length === 0) {
    return;
  }
  const readArray = resolveReadArrayFromRecords(readRecords, arrayPath);
  if (!readArray) {
    return;
  }
  const parts = arrayPath.split('.');
  const arrayKey = parts[parts.length - 1] ?? arrayPath;
  const parentParts = parts.slice(0, -1);
  const parent =
    parentParts.length > 0 ? ensureRecordAtPath(args, parentParts) : args;
  parent[arrayKey] = writeArray.map((item, index) => {
    if (!isRecord(item)) {
      return item;
    }
    const readItem = isRecord(readArray[index])
      ? readArray[index]
      : isRecord(readArray[0])
        ? readArray[0]
        : null;
    if (!readItem) {
      return item;
    }
    const next = { ...item };
    for (const field of fields) {
      if (!isPresent(next[field]) && isPresent(readItem[field])) {
        next[field] = readItem[field];
      }
    }
    return next;
  });
}

/**
 * compose_write 机器层：从 read tool observations 按 write tool schema 补齐必填项与数组项字段（不覆盖 LLM 已填值）。
 */
export function enrichWriteToolArgumentsFromReadObservations(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
  observations: Array<{ name: string; output: unknown }>,
  input: {
    isReadToolObservation: (toolName: string) => boolean;
  },
): Record<string, unknown> {
  const readRecords = collectReadObservationRecords(
    observations,
    input.isReadToolObservation,
  );
  if (readRecords.length === 0) {
    return args;
  }
  const paths = resolveWriteToolSubmitPaths(writeTool);
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const requiredPaths = compactParams
    .filter((row) => row.required)
    .map((row) => row.name);
  if (requiredPaths.length === 0) {
    const compact = buildCompactToolInput(
      writeTool.inputSchema,
      writeTool.schema,
      writeTool.agentMetadata,
    );
    for (const name of listRequiredParamNames(compact)) {
      requiredPaths.push(name);
    }
  }
  const next: Record<string, unknown> = JSON.parse(JSON.stringify(args));
  for (const path of requiredPaths) {
    if (isPresentAtWriteToolParamPath(next, path)) {
      continue;
    }
    const leaf = lastPathSegment(path.replace(/\[\]/g, ''));
    for (const record of readRecords) {
      let value: unknown = readValueAtParamPath(record, path);
      if (!isPresent(value)) {
        value = findNestedValueByLeaf(record, leaf, paths.bodyRoot);
      }
      if (isPresent(value)) {
        setValueAtParamPath(next, path, value, paths.bodyRoot);
        break;
      }
    }
  }
  const primaryPath = pickPrimaryWriteToolSubmitPath(paths, compactParams);
  const primaryLeaf = primaryPath
    ? lastPathSegment(primaryPath.replace(/\[\]/g, ''))
    : null;
  const arrayMergeFields = new Map<string, Set<string>>();
  for (const row of compactParams) {
    if (!row.name.includes('[]')) {
      continue;
    }
    const match = /^(.+)\[\]\.(.+)$/.exec(row.name);
    if (!match) {
      continue;
    }
    const leaf = match[2];
    if (primaryLeaf && leaf === primaryLeaf) {
      continue;
    }
    const fields = arrayMergeFields.get(match[1]) ?? new Set<string>();
    fields.add(leaf);
    arrayMergeFields.set(match[1], fields);
  }
  for (const [arrayPath, fields] of arrayMergeFields) {
    mergeWriteArrayItemFieldsFromReadRecords(
      next,
      arrayPath,
      [...fields],
      readRecords,
    );
  }
  return next;
}

/**
 * 从 write args 自身嵌套结构补齐顶层必填项（如 reviewReply[].reviewId → reviewId）。
 * 仅提升顶层 required，或 businessFields/identifier 标记的叶子，避免通用 leaf 歧义。
 * 不覆盖已有值；与 read observation enrich 互补。
 */
export function enrichWriteArgumentsFromSelf(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
): Record<string, unknown> {
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  let requiredPaths = compactParams
    .filter((row) => row.required)
    .map((row) => row.name);
  if (requiredPaths.length === 0) {
    const compact = buildCompactToolInput(
      writeTool.inputSchema,
      writeTool.schema,
      writeTool.agentMetadata,
    );
    requiredPaths = listRequiredParamNames(compact);
  }
  const paths = resolveWriteToolSubmitPaths(writeTool);
  const next: Record<string, unknown> = JSON.parse(JSON.stringify(args));
  for (const path of requiredPaths) {
    if (isPresentAtWriteToolParamPath(next, path)) {
      continue;
    }
    const normalizedPath = path.replace(/\[\]/g, '');
    const leaf = lastPathSegment(normalizedPath);
    const isTopLevelRequired =
      !normalizedPath.includes('.') && !path.includes('[');
    if (!isTopLevelRequired && !paths.identifierLeaves.has(leaf)) {
      continue;
    }
    const value = findNestedValueByLeaf(next, leaf, paths.bodyRoot);
    if (isPresent(value)) {
      setValueAtParamPath(next, path, value, paths.bodyRoot);
    }
  }
  return next;
}

/** 从 pageContext.entity 按 write tool schema + businessFields 补齐参数（无字段名硬编码）。 */
export function enrichWriteArgumentsFromPageContext(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
  pageContext: AgentChatPageContext | null | undefined,
): Record<string, unknown> {
  const entity = pageContext?.entity;
  if (!entity || typeof entity !== 'object') {
    return args;
  }
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const paths = resolveWriteToolSubmitPaths(writeTool);
  const next: Record<string, unknown> = JSON.parse(JSON.stringify(args));
  const paramLeafByPath = new Map(
    compactParams.map((row) => [
      row.name,
      lastPathSegment(row.name.replace(/\[\]/g, '')),
    ]),
  );

  for (const row of compactParams) {
    const leaf = paramLeafByPath.get(row.name) ?? '';
    const value = entity[row.name] ?? entity[leaf];
    if (!isPresent(value) || isPresentAtWriteToolParamPath(next, row.name)) {
      continue;
    }
    setValueAtParamPath(next, row.name, value, paths.bodyRoot);
  }

  const entityId = typeof entity.id === 'string' ? entity.id.trim() : '';
  if (!entityId) {
    return next;
  }

  const missingIdentifierRequired = compactParams.filter((row) => {
    if (!row.required) {
      return false;
    }
    const leaf = paramLeafByPath.get(row.name) ?? '';
    if (!paths.identifierLeaves.has(leaf)) {
      return false;
    }
    return !isPresentAtWriteToolParamPath(next, row.name);
  });
  if (missingIdentifierRequired.length === 1) {
    setValueAtParamPath(
      next,
      missingIdentifierRequired[0]!.name,
      entityId,
      paths.bodyRoot,
    );
  }

  return next;
}

/**
 * compose / gate 共用：LLM 产参 → read 补齐 → pageContext → 自身嵌套提升 → 待校验参数。
 */
export function normalizeWriteToolArguments(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
  observations: Array<{ name: string; output: unknown }>,
  input: {
    isReadToolObservation: (toolName: string) => boolean;
    pageContext?: AgentChatPageContext | null;
  },
): Record<string, unknown> {
  const fromRead = enrichWriteToolArgumentsFromReadObservations(
    args,
    writeTool,
    observations,
    input,
  );
  const fromPage = enrichWriteArgumentsFromPageContext(
    fromRead,
    writeTool,
    input.pageContext,
  );
  return enrichWriteArgumentsFromSelf(fromPage, writeTool);
}

/** 返回首个未满足的 required 参数路径，无缺失时返回 null。 */
export function findMissingRequiredWriteToolArgPath(
  args: Record<string, unknown>,
  writeTool: WriteToolDef,
): string | null {
  const compactParams = listToolInputCompactParams(
    writeTool.inputSchema,
    writeTool.schema,
  );
  const requiredPaths = compactParams
    .filter((row) => row.required)
    .map((row) => row.name);
  if (requiredPaths.length === 0) {
    const compact = buildCompactToolInput(
      writeTool.inputSchema,
      writeTool.schema,
      writeTool.agentMetadata,
    );
    for (const name of listRequiredParamNames(compact)) {
      if (!isPresent(args[name])) {
        return name;
      }
    }
    return null;
  }
  for (const path of requiredPaths) {
    if (!isPresentAtWriteToolParamPath(args, path)) {
      return path;
    }
  }
  return null;
}
