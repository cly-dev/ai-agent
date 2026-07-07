import { readValueAtWriteToolParamPath } from '../tool-engine/write-tool-draft-injection.util';
import type { WriteDraftEditPolicy } from './write-draft.types';

export class DraftReviewPolicyViolationError extends Error {
  constructor(
    public readonly code:
      | 'EDITED_LOCKED_FIELD'
      | 'EDITED_FIELD_NOT_ALLOWED'
      | 'WRITE_TOOL_NOT_RESOLVED'
      | 'MULTI_WRITE_EDIT_NOT_SUPPORTED',
    message: string,
  ) {
    super(message);
    this.name = 'DraftReviewPolicyViolationError';
  }
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** submitPath 注入预览正文时，允许变更其自身及祖先容器（如 items[].content → items）。 */
export function isSubmitPathInjectionScope(
  fieldPath: string,
  submitPath: string,
): boolean {
  if (fieldPath === submitPath) {
    return true;
  }
  return (
    submitPath.startsWith(`${fieldPath}[].`) ||
    submitPath.startsWith(`${fieldPath}.`)
  );
}

export function sanitizeDraftReviewArgumentsPatch(
  patch: Record<string, unknown>,
  policy: WriteDraftEditPolicy,
): Record<string, unknown> {
  if (!policy.allowArgumentsPatch) {
    return {};
  }
  const editablePaths = new Set(
    policy.fields.filter((field) => field.editable).map((field) => field.path),
  );
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (!editablePaths.has(key)) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function assertNoLockedFieldChanges(input: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  policy: WriteDraftEditPolicy;
}): void {
  const submitPath = input.policy.submitPath?.trim() || null;
  for (const field of input.policy.fields) {
    if (field.editable) {
      continue;
    }
    if (submitPath && isSubmitPathInjectionScope(field.path, submitPath)) {
      continue;
    }
    const beforeValue = readValueAtWriteToolParamPath(input.before, field.path);
    const afterValue = readValueAtWriteToolParamPath(input.after, field.path);
    if (!valuesEqual(beforeValue, afterValue)) {
      throw new DraftReviewPolicyViolationError(
        'EDITED_LOCKED_FIELD',
        `locked field changed: ${field.path}`,
      );
    }
  }
}
