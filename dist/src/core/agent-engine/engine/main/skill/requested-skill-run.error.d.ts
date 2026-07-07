export type RequestedSkillRunErrorCode = 'SKILL_NOT_VISIBLE' | 'SKILL_TOOLS_EMPTY' | 'SKILL_NOT_IN_SCOPE' | 'SKILL_EXPAND_FAILED';
export declare class RequestedSkillRunError extends Error {
    readonly code: RequestedSkillRunErrorCode;
    constructor(code: RequestedSkillRunErrorCode, message: string);
}
export declare function isRequestedSkillRunError(error: unknown): error is RequestedSkillRunError;
