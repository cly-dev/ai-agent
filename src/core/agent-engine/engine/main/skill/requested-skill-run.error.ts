export type RequestedSkillRunErrorCode =
  | 'SKILL_NOT_VISIBLE'
  | 'SKILL_TOOLS_EMPTY'
  | 'SKILL_NOT_IN_SCOPE'
  | 'SKILL_EXPAND_FAILED';

/** 用户指定 skillId 的运行期错误（与 C 端 skills/client 列表 / 角色权限对齐）。 */
export class RequestedSkillRunError extends Error {
  readonly code: RequestedSkillRunErrorCode;

  constructor(code: RequestedSkillRunErrorCode, message: string) {
    super(message);
    this.name = 'RequestedSkillRunError';
    this.code = code;
  }
}

export function isRequestedSkillRunError(
  error: unknown,
): error is RequestedSkillRunError {
  return error instanceof RequestedSkillRunError;
}
