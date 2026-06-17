/** Skill 是否至少有一个绑定 Tool 落在用户允许范围内（与 RequestedSkillRunService 发消息校验一致）。 */
export function skillHasRunnableToolIds(
  skill: { toolIds: number[] },
  allowedToolIds: ReadonlySet<number>,
): boolean {
  return skill.toolIds.some((toolId) => allowedToolIds.has(toolId));
}

export function filterSkillsWithRunnableToolIds<T extends { toolIds: number[] }>(
  skills: T[],
  allowedToolIds: ReadonlySet<number>,
): T[] {
  if (allowedToolIds.size === 0) {
    return [];
  }
  return skills.filter((skill) => skillHasRunnableToolIds(skill, allowedToolIds));
}
