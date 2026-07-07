"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeAvailableSkillsForOuterPlan = exports.toRequestedSkillPlanDetail = void 0;
const task_plan_util_1 = require("./task-plan.util");
function toRequestedSkillPlanDetail(skill) {
    if (!skill) {
        return undefined;
    }
    return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        config: skill.config,
        riskLevel: skill.riskLevel,
        skillToolIds: skill.skillToolIds,
        hostToolIds: skill.hostToolIds,
    };
}
exports.toRequestedSkillPlanDetail = toRequestedSkillPlanDetail;
function summarizeAvailableSkillsForOuterPlan(skills, scopedTools, scopedHostToolIds) {
    const scopedToolIdSet = new Set(scopedTools.map((tool) => tool.id));
    const scopedHostToolIdSet = new Set(scopedHostToolIds !== null && scopedHostToolIds !== void 0 ? scopedHostToolIds : []);
    return skills.map((skill) => {
        const matchingTools = scopedTools.filter((tool) => skill.skillToolIds.includes(tool.id) && scopedToolIdSet.has(tool.id));
        const toolRoles = [
            ...new Set((0, task_plan_util_1.summarizeScopedToolsForPlan)(matchingTools).map((tool) => tool.role)),
        ];
        const hostToolIds = scopedHostToolIdSet.size > 0
            ? skill.hostToolIds.filter((hostToolId) => scopedHostToolIdSet.has(hostToolId))
            : skill.hostToolIds;
        return {
            id: skill.id,
            name: skill.name,
            description: skill.description,
            capabilityKey: skill.capabilityKey,
            riskLevel: skill.riskLevel,
            toolRoles,
            hostToolIds,
            runnableKind: skill.runnableKind,
        };
    });
}
exports.summarizeAvailableSkillsForOuterPlan = summarizeAvailableSkillsForOuterPlan;
//# sourceMappingURL=outer-plan-skills.util.js.map