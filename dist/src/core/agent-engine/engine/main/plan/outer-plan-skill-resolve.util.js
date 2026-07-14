"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOuterPlanSkillSelectMethod = exports.resolveAutoOuterPlanSkill = void 0;
const skill_runnable_util_1 = require("../../../../skill/skill-runnable.util");
function resolveAutoOuterPlanSkill(input) {
    if (input.scopedHostToolIds.length === 0) {
        return null;
    }
    const scopedHostSet = new Set(input.scopedHostToolIds);
    const pageHostSkills = input.availableSkills.filter((skill) => (0, skill_runnable_util_1.skillMatchesPageHostTools)((0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)(skill), scopedHostSet));
    if (pageHostSkills.length !== 1) {
        return null;
    }
    return { skill: pageHostSkills[0], method: 'page_host_unique' };
}
exports.resolveAutoOuterPlanSkill = resolveAutoOuterPlanSkill;
function resolveOuterPlanSkillSelectMethod(input) {
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
exports.resolveOuterPlanSkillSelectMethod = resolveOuterPlanSkillSelectMethod;
//# sourceMappingURL=outer-plan-skill-resolve.util.js.map