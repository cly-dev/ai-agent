import type { WriteDraftEditPolicy } from './write-draft.types';
export declare class DraftReviewPolicyViolationError extends Error {
    readonly code: 'EDITED_LOCKED_FIELD' | 'EDITED_FIELD_NOT_ALLOWED' | 'WRITE_TOOL_NOT_RESOLVED' | 'MULTI_WRITE_EDIT_NOT_SUPPORTED';
    constructor(code: 'EDITED_LOCKED_FIELD' | 'EDITED_FIELD_NOT_ALLOWED' | 'WRITE_TOOL_NOT_RESOLVED' | 'MULTI_WRITE_EDIT_NOT_SUPPORTED', message: string);
}
export declare function isSubmitPathInjectionScope(fieldPath: string, submitPath: string): boolean;
export declare function sanitizeDraftReviewArgumentsPatch(patch: Record<string, unknown>, policy: WriteDraftEditPolicy): Record<string, unknown>;
export declare function assertNoLockedFieldChanges(input: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    policy: WriteDraftEditPolicy;
}): void;
