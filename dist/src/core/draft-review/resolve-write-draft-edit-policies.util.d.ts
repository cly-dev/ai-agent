import type { DraftReviewWriteToolLike } from './draft-review.types';
import type { WriteToolPolicyRow } from './load-write-tools-for-policy.util';
import type { WriteDraftEditPolicy, WriteDraftPublic } from './write-draft.types';
export declare function resolveWriteDraftEditPoliciesForPublicDrafts(publicList: WriteDraftPublic[], input?: {
    writeToolsById?: Map<number, WriteToolPolicyRow>;
    scopedTools?: DraftReviewWriteToolLike[];
}): WriteDraftEditPolicy[];
export declare function buildEditPolicyGateFields(editPolicies: WriteDraftEditPolicy[]): {
    editPolicy?: WriteDraftEditPolicy;
    editPolicies?: WriteDraftEditPolicy[];
};
