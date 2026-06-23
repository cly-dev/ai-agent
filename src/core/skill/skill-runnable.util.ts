export type SkillRunnableCapabilities = {
  skillToolIds: number[];
  hostToolIds: number[];
};

export type SkillRunnableKind = 'http' | 'host' | 'both';

export function normalizeSkillRunnableCapabilities(skill: {
  skillToolIds?: number[];
  toolIds?: number[];
  hostToolIds?: number[];
}): SkillRunnableCapabilities {
  return {
    skillToolIds: skill.skillToolIds ?? skill.toolIds ?? [],
    hostToolIds: skill.hostToolIds ?? [],
  };
}

export function deriveSkillRunnableKind(
  skill: SkillRunnableCapabilities,
): SkillRunnableKind {
  const hasHttp = skill.skillToolIds.length > 0;
  const hasHost = skill.hostToolIds.length > 0;
  if (hasHttp && hasHost) {
    return 'both';
  }
  if (hasHost) {
    return 'host';
  }
  return 'http';
}

/** 无 HTTP Tool、仅依赖 Agent 白名单内 SkillHostTool 的 Skill。 */
export function skillIsHostOnlySkill(skill: SkillRunnableCapabilities): boolean {
  return skill.skillToolIds.length === 0 && skill.hostToolIds.length > 0;
}

/** Skill 的 Host Tool 绑定与当前页 scoped host 是否有交集。 */
export function skillMatchesPageHostTools(
  skill: SkillRunnableCapabilities,
  scopedHostToolIds: ReadonlySet<number>,
): boolean {
  return (
    scopedHostToolIds.size > 0 &&
    skill.hostToolIds.some((hostToolId) => scopedHostToolIds.has(hostToolId))
  );
}

/**
 * Plan / 展开：intent 收窄的 HTTP tool + 当前页 scoped Host Tool 是否足以解析该 Skill。
 */
export function skillIsResolvableInScope(
  skill: SkillRunnableCapabilities,
  scopedToolIds: ReadonlySet<number>,
  scopedHostToolIds: ReadonlySet<number> = new Set(),
): boolean {
  const hasHttpMatch =
    scopedToolIds.size > 0 &&
    skill.skillToolIds.some((toolId) => scopedToolIds.has(toolId));
  const hasHostMatch =
    scopedHostToolIds.size > 0 &&
    skill.hostToolIds.some((hostToolId) => scopedHostToolIds.has(hostToolId));

  if (skillIsHostOnlySkill(skill)) {
    return hasHostMatch;
  }
  if (scopedToolIds.size === 0 && scopedHostToolIds.size === 0) {
    return false;
  }
  if (skill.hostToolIds.length === 0) {
    return hasHttpMatch;
  }
  // both：当前页 host 命中可单独召回；否则回退 HTTP intent 交集
  if (scopedHostToolIds.size > 0 && hasHostMatch) {
    return true;
  }
  return hasHttpMatch;
}

/** 用户显式 requestedSkillId：角色可见且至少绑定 HTTP 或 Agent 白名单内 Host Tool。 */
export function skillIsResolvableForRequested(
  skill: SkillRunnableCapabilities,
): boolean {
  if (skillIsHostOnlySkill(skill)) {
    return skill.hostToolIds.length > 0;
  }
  return skill.skillToolIds.length > 0;
}

/**
 * C 端 / 发消息：用户是否可运行该 Skill。
 * 纯 Host Skill 不要求 HTTP 权限；HTTP Skill 需与用户 allowed Tool 有交集。
 */
export function skillIsRunnableForUser(
  skill: { toolIds: number[]; hostToolIds?: number[] },
  allowedToolIds: ReadonlySet<number>,
): boolean {
  const caps = normalizeSkillRunnableCapabilities(skill);
  if (skillIsHostOnlySkill(caps)) {
    return caps.hostToolIds.length > 0;
  }
  if (allowedToolIds.size === 0) {
    return false;
  }
  return caps.skillToolIds.some((toolId) => allowedToolIds.has(toolId));
}

/** @deprecated 使用 skillIsRunnableForUser */
export function skillIsRunnable(
  skill: { toolIds: number[]; hostToolIds?: number[] },
  allowedToolIds: ReadonlySet<number>,
): boolean {
  return skillIsRunnableForUser(skill, allowedToolIds);
}

/** @deprecated 使用 skillIsRunnableForUser */
export function skillHasRunnableToolIds(
  skill: { toolIds: number[]; hostToolIds?: number[] },
  allowedToolIds: ReadonlySet<number>,
): boolean {
  return skillIsRunnableForUser(skill, allowedToolIds);
}

export function filterRunnableSkills<
  T extends { toolIds: number[]; hostToolIds?: number[] },
>(skills: T[], allowedToolIds: ReadonlySet<number>): T[] {
  return skills.filter((skill) => skillIsRunnableForUser(skill, allowedToolIds));
}

/** @deprecated 使用 filterRunnableSkills */
export function filterSkillsWithRunnableToolIds<
  T extends { toolIds: number[]; hostToolIds?: number[] },
>(skills: T[], allowedToolIds: ReadonlySet<number>): T[] {
  return filterRunnableSkills(skills, allowedToolIds);
}
