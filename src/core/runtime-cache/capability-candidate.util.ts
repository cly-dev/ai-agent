import type { Prisma } from '../../../generated/prisma/client';

/** 关闭时恢复「空 Agent 绑定 = 无能力」旧行为。默认开启 App 共享。 */
export function isCapabilityAppDefaultEnabled(): boolean {
  const raw = process.env.CAPABILITY_APP_DEFAULT?.trim().toLowerCase();
  return raw !== 'false' && raw !== '0';
}

export type AgentCapabilityRestrictFlags = {
  restrictTools: boolean;
  restrictHostTools: boolean;
  restrictSkills: boolean;
};

export type AgentBindingCounts = {
  toolBindings: number;
  hostToolBindings: number;
  skillBindings: number;
};

export function resolveEffectiveRestrictTools(
  flags: Pick<AgentCapabilityRestrictFlags, 'restrictTools'>,
  bindings: Pick<AgentBindingCounts, 'toolBindings'>,
  appDefaultEnabled = isCapabilityAppDefaultEnabled(),
): boolean {
  if (!appDefaultEnabled) {
    return true;
  }
  return flags.restrictTools || bindings.toolBindings > 0;
}

export function resolveEffectiveRestrictHostTools(
  flags: Pick<AgentCapabilityRestrictFlags, 'restrictHostTools'>,
  bindings: Pick<AgentBindingCounts, 'hostToolBindings'>,
  appDefaultEnabled = isCapabilityAppDefaultEnabled(),
): boolean {
  if (!appDefaultEnabled) {
    return true;
  }
  return flags.restrictHostTools || bindings.hostToolBindings > 0;
}

export function resolveEffectiveRestrictSkills(
  flags: Pick<AgentCapabilityRestrictFlags, 'restrictSkills'>,
  bindings: Pick<AgentBindingCounts, 'skillBindings'>,
  appDefaultEnabled = isCapabilityAppDefaultEnabled(),
): boolean {
  if (!appDefaultEnabled) {
    return true;
  }
  return flags.restrictSkills || bindings.skillBindings > 0;
}

/**
 * 计算 Agent HTTP Tool 候选 ID 列表（未应用 Role 过滤）。
 */
export function resolveAgentToolCandidateIds(input: {
  appDefaultEnabled?: boolean;
  restrictTools: boolean;
  whitelistIds: number[];
  appActiveIds: number[];
}): number[] {
  const appDefaultEnabled =
    input.appDefaultEnabled ?? isCapabilityAppDefaultEnabled();
  const whitelistIds = [...input.whitelistIds].sort((a, b) => a - b);
  if (!appDefaultEnabled) {
    return whitelistIds;
  }
  const tightened = resolveEffectiveRestrictTools(
    { restrictTools: input.restrictTools },
    { toolBindings: whitelistIds.length },
    true,
  );
  if (!tightened) {
    return [...input.appActiveIds].sort((a, b) => a - b);
  }
  if (whitelistIds.length === 0) {
    return [];
  }
  const allowed = new Set(whitelistIds);
  return input.appActiveIds.filter((id) => allowed.has(id)).sort((a, b) => a - b);
}

export function resolveAgentHostToolCandidateIds(input: {
  appDefaultEnabled?: boolean;
  restrictHostTools: boolean;
  whitelistIds: number[];
  appActiveIds: number[];
}): number[] {
  const appDefaultEnabled =
    input.appDefaultEnabled ?? isCapabilityAppDefaultEnabled();
  const whitelistIds = [...input.whitelistIds].sort((a, b) => a - b);
  if (!appDefaultEnabled) {
    return whitelistIds;
  }
  const tightened = resolveEffectiveRestrictHostTools(
    { restrictHostTools: input.restrictHostTools },
    { hostToolBindings: whitelistIds.length },
    true,
  );
  if (!tightened) {
    return [...input.appActiveIds].sort((a, b) => a - b);
  }
  if (whitelistIds.length === 0) {
    return [];
  }
  const allowed = new Set(whitelistIds);
  return input.appActiveIds.filter((id) => allowed.has(id)).sort((a, b) => a - b);
}

/** Prisma Skill 可见性（Agent 候选集，不含 RoleSkill）。 */
export function buildAgentSkillVisibilityWhere(input: {
  appClientId: number;
  agentId: number;
  restrictSkills: boolean;
  skillWhitelistIds: number[];
  appDefaultEnabled?: boolean;
}): Prisma.SkillWhereInput {
  const appDefaultEnabled =
    input.appDefaultEnabled ?? isCapabilityAppDefaultEnabled();
  const base: Prisma.SkillWhereInput = {
    appClientId: input.appClientId,
    isActive: true,
  };
  if (!appDefaultEnabled) {
    return {
      ...base,
      agentSkills: { some: { agentId: input.agentId } },
    };
  }
  const tightened = resolveEffectiveRestrictSkills(
    { restrictSkills: input.restrictSkills },
    { skillBindings: input.skillWhitelistIds.length },
    true,
  );
  if (!tightened) {
    return base;
  }
  if (input.skillWhitelistIds.length === 0) {
    return { ...base, id: -1 };
  }
  return {
    ...base,
    agentSkills: { some: { agentId: input.agentId } },
  };
}
