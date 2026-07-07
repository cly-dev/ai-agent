import { parseAgentMetadata } from '../tool-engine/tool-agent-metadata.util';
import type {
  DraftReviewEditMode,
  DraftReviewFieldOverride,
  DraftReviewFieldRole,
  DraftReviewFieldWidget,
  DraftReviewPolicy,
} from '../tool-engine/tool-agent-metadata.types';
import {
  listToolInputCompactParams,
  type ToolParamCompact,
} from '../tool-engine/tool-decision-input.util';
import {
  normalizeParamPathListAliases,
  resolveArrayItemParamPathAlias,
} from '../tool-engine/tool-param-path-alias.util';
import {
  readValueAtWriteToolParamPath,
  resolveEffectiveWriteToolSubmitPath,
  resolveWriteToolSubmitPaths,
} from '../tool-engine/write-tool-draft-injection.util';
import type { DraftReviewWriteToolLike } from './draft-review.types';
import type {
  WriteDraftEditPolicy,
  WriteDraftFieldPolicy,
} from './write-draft.types';

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

function isIdentifierLeaf(leaf: string): boolean {
  return /(?:^|_)(id|Id|ID)$/.test(leaf) || leaf.toLowerCase().endsWith('id');
}

function resolveConfiguredPolicy(
  writeTool: DraftReviewWriteToolLike,
): DraftReviewPolicy {
  const meta = parseAgentMetadata(writeTool.agentMetadata);
  return meta?.draftReview ?? {};
}

function resolveEditMode(policy: DraftReviewPolicy): DraftReviewEditMode {
  return policy.editMode ?? 'preview_only';
}

function resolveAllowArgumentsPatch(
  policy: DraftReviewPolicy,
  editMode: DraftReviewEditMode,
): boolean {
  if (typeof policy.allowArgumentsPatch === 'boolean') {
    return policy.allowArgumentsPatch;
  }
  return editMode === 'allowlisted_fields' || editMode === 'full';
}

function buildOverrideMap(
  overrides: DraftReviewFieldOverride[] | undefined,
): Map<string, DraftReviewFieldOverride> {
  return new Map((overrides ?? []).map((row) => [row.path, row]));
}

function inferFieldRole(input: {
  path: string;
  row: ToolParamCompact;
  policy: DraftReviewPolicy;
  businessFields: Set<string>;
  identifierLeaves: Set<string>;
  override?: DraftReviewFieldOverride;
}): DraftReviewFieldRole {
  if (input.override?.role) {
    return input.override.role;
  }
  const leaf = lastPathSegment(input.path);
  if (
    input.policy.lockedPaths?.includes(input.path) ||
    input.businessFields.has(leaf) ||
    input.businessFields.has(input.path) ||
    input.identifierLeaves.has(leaf) ||
    isIdentifierLeaf(leaf)
  ) {
    return 'identifier';
  }
  if (input.row.enum?.length) {
    return 'enum';
  }
  if (isStringParamType(input.row.type)) {
    return 'content';
  }
  return 'system';
}

function isFieldEditable(input: {
  path: string;
  role: DraftReviewFieldRole;
  editMode: DraftReviewEditMode;
  policy: DraftReviewPolicy;
}): boolean {
  if (input.role === 'identifier' || input.role === 'system') {
    return false;
  }
  if (input.policy.lockedPaths?.includes(input.path)) {
    return false;
  }
  switch (input.editMode) {
    case 'preview_only':
      return false;
    case 'allowlisted_fields':
      return (input.policy.editablePaths ?? []).includes(input.path);
    case 'full':
      return input.role === 'content' || input.role === 'enum';
    default:
      return false;
  }
}

function resolveWidget(input: {
  role: DraftReviewFieldRole;
  editable: boolean;
  override?: DraftReviewFieldOverride;
}): DraftReviewFieldWidget {
  if (!input.editable) {
    return input.override?.widget === 'hidden' ? 'hidden' : 'readonly';
  }
  if (input.override?.widget) {
    return input.override.widget;
  }
  if (input.role === 'enum') {
    return 'select';
  }
  return 'textarea';
}

function defaultReason(role: DraftReviewFieldRole): string | undefined {
  switch (role) {
    case 'identifier':
      return '业务标识由系统自动带入，不可修改';
    case 'scenario':
      return '场景固定参数，不可修改';
    case 'system':
      return '系统字段，不可修改';
    default:
      return undefined;
  }
}

function buildEnumOptions(
  row: ToolParamCompact,
): Array<{ label: string; value: string }> | undefined {
  if (!row.enum?.length) {
    return undefined;
  }
  return row.enum.map((value) => ({ label: value, value }));
}

/** 已有展开子 path 时省略容器 param（如 items + items[].content 只保留后者）。 */
function filterContainerCompactParams(
  compactParams: ToolParamCompact[],
): ToolParamCompact[] {
  const names = compactParams.map((row) => row.name);
  return compactParams.filter((row) => {
    const prefixDot = `${row.name}.`;
    const prefixArray = `${row.name}[].`;
    const hasExpandedChild = names.some(
      (name) =>
        name !== row.name &&
        (name.startsWith(prefixDot) || name.startsWith(prefixArray)),
    );
    return !hasExpandedChild;
  });
}

function normalizeDraftReviewPolicyPathsForRuntime(
  policy: DraftReviewPolicy,
  paramPaths: ReadonlySet<string>,
): DraftReviewPolicy {
  return {
    ...policy,
    ...(policy.submitPath
      ? {
          submitPath: resolveArrayItemParamPathAlias(
            policy.submitPath.trim(),
            paramPaths,
          ),
        }
      : {}),
    ...(policy.editablePaths
      ? {
          editablePaths: normalizeParamPathListAliases(
            policy.editablePaths,
            paramPaths,
          ),
        }
      : {}),
    ...(policy.lockedPaths
      ? {
          lockedPaths: normalizeParamPathListAliases(
            policy.lockedPaths,
            paramPaths,
          ),
        }
      : {}),
    ...(policy.fieldOverrides
      ? {
          fieldOverrides: policy.fieldOverrides.map((row) => ({
            ...row,
            path: resolveArrayItemParamPathAlias(row.path, paramPaths),
          })),
        }
      : {}),
  };
}

export function resolveWriteDraftEditPolicy(input: {
  writeTool: DraftReviewWriteToolLike;
  arguments: Record<string, unknown>;
}): WriteDraftEditPolicy {
  const rawPolicy = resolveConfiguredPolicy(input.writeTool);
  const allCompactParams = listToolInputCompactParams(
    input.writeTool.inputSchema,
    input.writeTool.schema,
  );
  const paramPaths = new Set(allCompactParams.map((row) => row.name));
  const policy = normalizeDraftReviewPolicyPathsForRuntime(rawPolicy, paramPaths);
  const editMode = resolveEditMode(policy);
  const allowArgumentsPatch = resolveAllowArgumentsPatch(policy, editMode);
  const meta = parseAgentMetadata(input.writeTool.agentMetadata);
  const businessFields = new Set(
    normalizeParamPathListAliases(meta?.businessFields ?? [], paramPaths),
  );
  const submitPaths = resolveWriteToolSubmitPaths(input.writeTool);
  const identifierLeaves = submitPaths.identifierLeaves;
  const overrideMap = buildOverrideMap(policy.fieldOverrides);
  const compactParams = filterContainerCompactParams(allCompactParams);
  const submitPath = resolveEffectiveWriteToolSubmitPath(input.writeTool);

  const fields: WriteDraftFieldPolicy[] = compactParams.map((row) => {
    const override = overrideMap.get(row.name);
    const role = inferFieldRole({
      path: row.name,
      row,
      policy,
      businessFields,
      identifierLeaves,
      override,
    });
    const editable = isFieldEditable({
      path: row.name,
      role,
      editMode,
      policy,
    });
    const widget = resolveWidget({ role, editable, override });
    return {
      path: row.name,
      label:
        override?.label?.trim() ||
        row.description?.trim() ||
        row.name,
      role,
      widget,
      editable,
      required: row.required,
      value: readValueAtWriteToolParamPath(input.arguments, row.name),
      enumOptions: buildEnumOptions(row),
      reason: override?.reason ?? defaultReason(role),
    };
  });

  return {
    editMode,
    submitPath: submitPath ?? null,
    allowArgumentsPatch,
    fields,
  };
}

export function resolveWriteDraftEditPolicyForToolCall(input: {
  writeTool: DraftReviewWriteToolLike | null | undefined;
  arguments: Record<string, unknown>;
}): WriteDraftEditPolicy | null {
  if (!input.writeTool) {
    return null;
  }
  return resolveWriteDraftEditPolicy({
    writeTool: input.writeTool,
    arguments: input.arguments,
  });
}
