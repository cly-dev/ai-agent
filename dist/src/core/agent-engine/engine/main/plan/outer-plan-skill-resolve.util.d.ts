import type { AvailableSkillRow } from '../../../../skill/skill.types';
export type OuterPlanSkillSelectMethod = 'page_host_unique' | 'requested' | 'outer_plan_llm' | 'workflow' | 'template' | 'minimal';
export type AutoOuterPlanSkillSelection = {
    skill: AvailableSkillRow;
    method: 'page_host_unique';
};
export declare function resolveAutoOuterPlanSkill(input: {
    availableSkills: AvailableSkillRow[];
    scopedHostToolIds: number[];
}): AutoOuterPlanSkillSelection | null;
export declare function resolveOuterPlanSkillSelectMethod(input: {
    autoSelection: AutoOuterPlanSkillSelection | null;
    requestedSkillId?: number | null;
    planMethod: string;
}): {
    outerSkillSelectMethod: OuterPlanSkillSelectMethod;
    autoSelectedSkillId: number | null;
};
