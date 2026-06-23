import type { AvailableSkillRow } from '../../../../skill/skill.types';
import {
  normalizeSkillRunnableCapabilities,
  skillMatchesPageHostTools,
} from '../../../../skill/skill-runnable.util';

/** 外层 Plan 如何选中 Skill（可观测 / 排错）。 */
export type OuterPlanSkillSelectMethod =
  | 'page_host_unique'
  | 'requested'
  | 'outer_plan_llm'
  | 'workflow'
  | 'template'
  | 'minimal';

export type AutoOuterPlanSkillSelection = {
  skill: AvailableSkillRow;
  method: 'page_host_unique';
};

/**
 * 当前页 host_tool 与 Skill 绑定唯一对应时，自动外层 kind=skill（无需 Plan LLM）。
 * 适用于纯 Host 与 both（page host 命中即可，不要求 intent HTTP 交集）。
 */
export function resolveAutoOuterPlanSkill(input: {
  availableSkills: AvailableSkillRow[];
  scopedHostToolIds: number[];
}): AutoOuterPlanSkillSelection | null {
  if (input.scopedHostToolIds.length === 0) {
    return null;
  }
  const scopedHostSet = new Set(input.scopedHostToolIds);
  const pageHostSkills = input.availableSkills.filter((skill) =>
    skillMatchesPageHostTools(
      normalizeSkillRunnableCapabilities(skill),
      scopedHostSet,
    ),
  );
  if (pageHostSkills.length !== 1) {
    return null;
  }
  return { skill: pageHostSkills[0], method: 'page_host_unique' };
}

export function resolveOuterPlanSkillSelectMethod(input: {
  autoSelection: AutoOuterPlanSkillSelection | null;
  requestedSkillId?: number | null;
  planMethod: string;
}): {
  outerSkillSelectMethod: OuterPlanSkillSelectMethod;
  autoSelectedSkillId: number | null;
} {
  if (input.autoSelection) {
    return {
      outerSkillSelectMethod: 'page_host_unique',
      autoSelectedSkillId: input.autoSelection.skill.id,
    };
  }
  if (input.requestedSkillId != null) {
    return {
      outerSkillSelectMethod: 'requested',
      autoSelectedSkillId: null,
    };
  }
  const method = input.planMethod;
  if (method === 'template' || method === 'minimal' || method === 'workflow') {
    return {
      outerSkillSelectMethod: method,
      autoSelectedSkillId: null,
    };
  }
  return {
    outerSkillSelectMethod: 'outer_plan_llm',
    autoSelectedSkillId: null,
  };
}
