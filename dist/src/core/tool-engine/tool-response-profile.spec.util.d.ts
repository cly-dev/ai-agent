import type { ToolResponseProfile } from './tool-response-profile.types';
export declare const RESPONSE_PROFILE_LIST_PATH_CANDIDATES: readonly ["data", "list", "records", "items", "data.list", "data.records"];
export declare const RESPONSE_PROFILE_ROOT_META_KEYS: readonly ["total", "page", "pageSize", "pages", "size"];
export type ResponseProfileValidationIssue = {
    code: string;
    message: string;
    path?: string;
};
export type NormalizeResponseProfileResult = {
    profile: ToolResponseProfile;
    adjustments: string[];
};
export declare function normalizeResponseProfile(profile: ToolResponseProfile, sampleData?: unknown): NormalizeResponseProfileResult;
export declare function validateResponseProfile(profile: ToolResponseProfile, sampleData?: unknown): ResponseProfileValidationIssue[];
export declare function assertValidResponseProfile(profile: ToolResponseProfile, sampleData?: unknown): ToolResponseProfile;
export declare function parseAndNormalizeResponseProfile(raw: unknown, sampleData?: unknown): ToolResponseProfile | null;
