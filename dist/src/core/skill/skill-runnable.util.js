"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterSkillsWithRunnableToolIds = exports.filterRunnableSkills = exports.skillHasRunnableToolIds = exports.skillIsRunnable = exports.skillIsRunnableForUser = exports.skillIsResolvableForRequested = exports.skillIsResolvableInScope = exports.skillIsVisibleOnClientPage = exports.skillMatchesPageHostTools = exports.skillIsHostOnlySkill = exports.deriveSkillRunnableKind = exports.normalizeSkillRunnableCapabilities = exports.skillIsWorkflowBound = void 0;
function skillIsWorkflowBound(skill) {
    return skill.flowId != null && skill.flowId > 0;
}
exports.skillIsWorkflowBound = skillIsWorkflowBound;
function normalizeSkillRunnableCapabilities(skill) {
    var _a, _b, _c;
    return {
        skillToolIds: (_b = (_a = skill.skillToolIds) !== null && _a !== void 0 ? _a : skill.toolIds) !== null && _b !== void 0 ? _b : [],
        hostToolIds: (_c = skill.hostToolIds) !== null && _c !== void 0 ? _c : [],
        workflowId: skill.workflowId,
        flowId: skill.flowId,
    };
}
exports.normalizeSkillRunnableCapabilities = normalizeSkillRunnableCapabilities;
function deriveSkillRunnableKind(skill) {
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
exports.deriveSkillRunnableKind = deriveSkillRunnableKind;
function skillIsHostOnlySkill(skill) {
    return skill.skillToolIds.length === 0 && skill.hostToolIds.length > 0;
}
exports.skillIsHostOnlySkill = skillIsHostOnlySkill;
function skillMatchesPageHostTools(skill, scopedHostToolIds) {
    return (scopedHostToolIds.size > 0 &&
        skill.hostToolIds.some((hostToolId) => scopedHostToolIds.has(hostToolId)));
}
exports.skillMatchesPageHostTools = skillMatchesPageHostTools;
function skillIsVisibleOnClientPage(skill, scopedHostToolIds) {
    if (skillIsWorkflowBound(skill)) {
        return true;
    }
    if (skill.hostToolIds.length === 0) {
        return skill.skillToolIds.length > 0;
    }
    if (scopedHostToolIds.size === 0) {
        return false;
    }
    return skillMatchesPageHostTools(skill, scopedHostToolIds);
}
exports.skillIsVisibleOnClientPage = skillIsVisibleOnClientPage;
function skillIsResolvableInScope(skill, scopedToolIds, scopedHostToolIds = new Set()) {
    if (skillIsWorkflowBound(skill)) {
        return true;
    }
    const hasHttpMatch = scopedToolIds.size > 0 &&
        skill.skillToolIds.some((toolId) => scopedToolIds.has(toolId));
    const hasHostMatch = scopedHostToolIds.size > 0 &&
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
    if (scopedHostToolIds.size > 0 && hasHostMatch) {
        return true;
    }
    return hasHttpMatch;
}
exports.skillIsResolvableInScope = skillIsResolvableInScope;
function skillIsResolvableForRequested(skill) {
    if (skillIsWorkflowBound(skill)) {
        return true;
    }
    if (skillIsHostOnlySkill(skill)) {
        return skill.hostToolIds.length > 0;
    }
    return skill.skillToolIds.length > 0;
}
exports.skillIsResolvableForRequested = skillIsResolvableForRequested;
function skillIsRunnableForUser(skill, allowedToolIds) {
    if (skillIsWorkflowBound(skill)) {
        return true;
    }
    const caps = normalizeSkillRunnableCapabilities(skill);
    if (skillIsHostOnlySkill(caps)) {
        return caps.hostToolIds.length > 0;
    }
    if (allowedToolIds.size === 0) {
        return false;
    }
    return caps.skillToolIds.some((toolId) => allowedToolIds.has(toolId));
}
exports.skillIsRunnableForUser = skillIsRunnableForUser;
function skillIsRunnable(skill, allowedToolIds) {
    return skillIsRunnableForUser(skill, allowedToolIds);
}
exports.skillIsRunnable = skillIsRunnable;
function skillHasRunnableToolIds(skill, allowedToolIds) {
    return skillIsRunnableForUser(skill, allowedToolIds);
}
exports.skillHasRunnableToolIds = skillHasRunnableToolIds;
function filterRunnableSkills(skills, allowedToolIds) {
    return skills.filter((skill) => skillIsRunnableForUser(skill, allowedToolIds));
}
exports.filterRunnableSkills = filterRunnableSkills;
function filterSkillsWithRunnableToolIds(skills, allowedToolIds) {
    return filterRunnableSkills(skills, allowedToolIds);
}
exports.filterSkillsWithRunnableToolIds = filterSkillsWithRunnableToolIds;
//# sourceMappingURL=skill-runnable.util.js.map