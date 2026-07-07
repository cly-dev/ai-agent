import type { DraftReviewPolicy } from './tool-agent-metadata.types';
export declare class DraftReviewPolicyConfigError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function normalizeDraftReviewPolicyForPersist(policy: DraftReviewPolicy, inputSchema: unknown, fallbackSchema?: unknown): DraftReviewPolicy;
export declare function normalizeBusinessFieldsForPersist(businessFields: string[], inputSchema: unknown, fallbackSchema?: unknown): string[];
