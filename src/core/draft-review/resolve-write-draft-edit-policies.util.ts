import type { DraftReviewWriteToolLike } from './draft-review.types';
import type { WriteToolPolicyRow } from './load-write-tools-for-policy.util';
import { resolveWriteDraftEditPolicyForToolCall } from './resolve-write-draft-edit-policy.util';
import type {
  WriteDraftEditPolicy,
  WriteDraftPublic,
} from './write-draft.types';

function resolveWriteToolForPublicDraft(
  draft: WriteDraftPublic,
  input: {
    writeToolsById?: Map<number, WriteToolPolicyRow>;
    scopedTools?: DraftReviewWriteToolLike[];
  },
): DraftReviewWriteToolLike | null {
  const toolId = draft.tool.toolId;
  if (toolId != null && input.writeToolsById?.has(toolId)) {
    return input.writeToolsById.get(toolId) ?? null;
  }
  if (input.writeToolsById?.size) {
    const byName = [...input.writeToolsById.values()].find(
      (tool) => tool.name === draft.tool.name,
    );
    if (byName) {
      return byName;
    }
  }
  if (input.scopedTools?.length) {
    if (toolId != null) {
      const byId = input.scopedTools.find(
        (tool) => 'id' in tool && (tool as { id?: number }).id === toolId,
      );
      if (byId) {
        return byId;
      }
    }
    return (
      input.scopedTools.find((tool) => tool.name === draft.tool.name) ?? null
    );
  }
  return null;
}

export function resolveWriteDraftEditPoliciesForPublicDrafts(
  publicList: WriteDraftPublic[],
  input: {
    writeToolsById?: Map<number, WriteToolPolicyRow>;
    scopedTools?: DraftReviewWriteToolLike[];
  } = {},
): WriteDraftEditPolicy[] {
  return publicList
    .map((draft) =>
      resolveWriteDraftEditPolicyForToolCall({
        writeTool: resolveWriteToolForPublicDraft(draft, input),
        arguments: draft.arguments,
      }),
    )
    .filter((policy): policy is WriteDraftEditPolicy => policy != null);
}

/** 将 editPolicy 列表折叠为 SSE / run-state 对外字段。 */
export function buildEditPolicyGateFields(editPolicies: WriteDraftEditPolicy[]): {
  editPolicy?: WriteDraftEditPolicy;
  editPolicies?: WriteDraftEditPolicy[];
} {
  if (editPolicies.length === 0) {
    return {};
  }
  return {
    editPolicy: editPolicies[0],
    ...(editPolicies.length > 1 ? { editPolicies } : {}),
  };
}
