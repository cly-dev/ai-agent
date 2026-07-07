import { listToolInputCompactParams } from './tool-decision-input.util';
import {
  normalizeParamPathListAliases,
  resolveArrayItemParamPathAlias,
  suggestArrayItemParamPathAlias,
} from './tool-param-path-alias.util';
import type {
  DraftReviewEditMode,
  DraftReviewFieldOverride,
  DraftReviewPolicy,
} from './tool-agent-metadata.types';

export class DraftReviewPolicyConfigError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DraftReviewPolicyConfigError';
  }
}

function assertPathsExistInSchema(
  paths: string[],
  paramPaths: ReadonlySet<string>,
  field: 'editablePaths' | 'lockedPaths' | 'fieldOverrides',
): void {
  for (const path of paths) {
    if (!paramPaths.has(path)) {
      const suggestion = suggestArrayItemParamPathAlias(path, paramPaths);
      throw new DraftReviewPolicyConfigError(
        'DRAFT_REVIEW_PATH_NOT_IN_SCHEMA',
        suggestion
          ? `draftReview.${field} contains unknown param path: ${path}; use "${suggestion}" (array segments require [] in compact path)`
          : `draftReview.${field} contains unknown param path: ${path}`,
      );
    }
  }
}

function normalizeFieldOverrides(
  overrides: DraftReviewFieldOverride[] | undefined,
  paramPaths: ReadonlySet<string>,
): DraftReviewFieldOverride[] | undefined {
  if (!overrides?.length) {
    return undefined;
  }
  return overrides.map((row) => ({
    ...row,
    path: resolveArrayItemParamPathAlias(row.path, paramPaths),
  }));
}

/**
 * 保存 Tool 时规范化 draftReview，拒绝互相矛盾或引用不存在 schema 路径的配置。
 */
export function normalizeDraftReviewPolicyForPersist(
  policy: DraftReviewPolicy,
  inputSchema: unknown,
  fallbackSchema?: unknown,
): DraftReviewPolicy {
  const editMode: DraftReviewEditMode = policy.editMode ?? 'preview_only';
  const paramPaths = new Set(
    listToolInputCompactParams(inputSchema, fallbackSchema).map((row) => row.name),
  );

  const submitPath = policy.submitPath
    ? resolveArrayItemParamPathAlias(policy.submitPath, paramPaths)
    : undefined;
  if (policy.submitPath && !paramPaths.has(submitPath!)) {
    const suggestion = suggestArrayItemParamPathAlias(policy.submitPath, paramPaths);
    throw new DraftReviewPolicyConfigError(
      'DRAFT_REVIEW_SUBMIT_PATH_INVALID',
      suggestion
        ? `draftReview.submitPath "${policy.submitPath}" not found; use "${suggestion}" (array segments require [] in compact path)`
        : `draftReview.submitPath "${policy.submitPath}" not found in tool inputSchema`,
    );
  }

  if (editMode === 'preview_only' && policy.allowArgumentsPatch === true) {
    throw new DraftReviewPolicyConfigError(
      'DRAFT_REVIEW_CONFIG_CONFLICT',
      'draftReview.allowArgumentsPatch cannot be true when editMode is preview_only; use editMode allowlisted_fields with editablePaths instead',
    );
  }

  const editablePaths = normalizeParamPathListAliases(
    policy.editablePaths ?? [],
    paramPaths,
  );
  const lockedPaths = normalizeParamPathListAliases(
    policy.lockedPaths ?? [],
    paramPaths,
  );
  const fieldOverrides = normalizeFieldOverrides(policy.fieldOverrides, paramPaths);
  const overridePaths = (fieldOverrides ?? []).map((row) => row.path);

  if (editMode === 'allowlisted_fields' && editablePaths.length === 0) {
    throw new DraftReviewPolicyConfigError(
      'DRAFT_REVIEW_EDITABLE_PATHS_REQUIRED',
      'draftReview.editablePaths is required when editMode is allowlisted_fields',
    );
  }

  assertPathsExistInSchema(editablePaths, paramPaths, 'editablePaths');
  assertPathsExistInSchema(lockedPaths, paramPaths, 'lockedPaths');
  assertPathsExistInSchema(overridePaths, paramPaths, 'fieldOverrides');

  const normalized: DraftReviewPolicy = {
    editMode,
    ...(submitPath ? { submitPath } : {}),
    ...(editablePaths.length > 0 ? { editablePaths } : {}),
    ...(lockedPaths.length > 0 ? { lockedPaths } : {}),
    ...(fieldOverrides?.length ? { fieldOverrides } : {}),
  };

  if (editMode !== 'preview_only' && policy.allowArgumentsPatch !== undefined) {
    normalized.allowArgumentsPatch = policy.allowArgumentsPatch;
  }

  return normalized;
}

export function normalizeBusinessFieldsForPersist(
  businessFields: string[],
  inputSchema: unknown,
  fallbackSchema?: unknown,
): string[] {
  const paramPaths = new Set(
    listToolInputCompactParams(inputSchema, fallbackSchema).map((row) => row.name),
  );
  return normalizeParamPathListAliases(businessFields, paramPaths);
}
