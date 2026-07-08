"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentSkillVisibilityWhere = exports.resolveAgentHostToolCandidateIds = exports.resolveAgentToolCandidateIds = exports.resolveEffectiveRestrictSkills = exports.resolveEffectiveRestrictHostTools = exports.resolveEffectiveRestrictTools = exports.isCapabilityAppDefaultEnabled = void 0;
function isCapabilityAppDefaultEnabled() {
    var _a;
    const raw = (_a = process.env.CAPABILITY_APP_DEFAULT) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    return raw !== 'false' && raw !== '0';
}
exports.isCapabilityAppDefaultEnabled = isCapabilityAppDefaultEnabled;
function resolveEffectiveRestrictTools(flags, bindings, appDefaultEnabled = isCapabilityAppDefaultEnabled()) {
    if (!appDefaultEnabled) {
        return true;
    }
    return flags.restrictTools || bindings.toolBindings > 0;
}
exports.resolveEffectiveRestrictTools = resolveEffectiveRestrictTools;
function resolveEffectiveRestrictHostTools(flags, bindings, appDefaultEnabled = isCapabilityAppDefaultEnabled()) {
    if (!appDefaultEnabled) {
        return true;
    }
    return flags.restrictHostTools || bindings.hostToolBindings > 0;
}
exports.resolveEffectiveRestrictHostTools = resolveEffectiveRestrictHostTools;
function resolveEffectiveRestrictSkills(flags, bindings, appDefaultEnabled = isCapabilityAppDefaultEnabled()) {
    if (!appDefaultEnabled) {
        return true;
    }
    return flags.restrictSkills || bindings.skillBindings > 0;
}
exports.resolveEffectiveRestrictSkills = resolveEffectiveRestrictSkills;
function resolveAgentToolCandidateIds(input) {
    var _a;
    const appDefaultEnabled = (_a = input.appDefaultEnabled) !== null && _a !== void 0 ? _a : isCapabilityAppDefaultEnabled();
    const whitelistIds = [...input.whitelistIds].sort((a, b) => a - b);
    if (!appDefaultEnabled) {
        return whitelistIds;
    }
    const tightened = resolveEffectiveRestrictTools({ restrictTools: input.restrictTools }, { toolBindings: whitelistIds.length }, true);
    if (!tightened) {
        return [...input.appActiveIds].sort((a, b) => a - b);
    }
    if (whitelistIds.length === 0) {
        return [];
    }
    const allowed = new Set(whitelistIds);
    return input.appActiveIds.filter((id) => allowed.has(id)).sort((a, b) => a - b);
}
exports.resolveAgentToolCandidateIds = resolveAgentToolCandidateIds;
function resolveAgentHostToolCandidateIds(input) {
    var _a;
    const appDefaultEnabled = (_a = input.appDefaultEnabled) !== null && _a !== void 0 ? _a : isCapabilityAppDefaultEnabled();
    const whitelistIds = [...input.whitelistIds].sort((a, b) => a - b);
    if (!appDefaultEnabled) {
        return whitelistIds;
    }
    const tightened = resolveEffectiveRestrictHostTools({ restrictHostTools: input.restrictHostTools }, { hostToolBindings: whitelistIds.length }, true);
    if (!tightened) {
        return [...input.appActiveIds].sort((a, b) => a - b);
    }
    if (whitelistIds.length === 0) {
        return [];
    }
    const allowed = new Set(whitelistIds);
    return input.appActiveIds.filter((id) => allowed.has(id)).sort((a, b) => a - b);
}
exports.resolveAgentHostToolCandidateIds = resolveAgentHostToolCandidateIds;
function buildAgentSkillVisibilityWhere(input) {
    var _a;
    const appDefaultEnabled = (_a = input.appDefaultEnabled) !== null && _a !== void 0 ? _a : isCapabilityAppDefaultEnabled();
    const base = {
        appClientId: input.appClientId,
        isActive: true,
    };
    if (!appDefaultEnabled) {
        return Object.assign(Object.assign({}, base), { agentSkills: { some: { agentId: input.agentId } } });
    }
    const tightened = resolveEffectiveRestrictSkills({ restrictSkills: input.restrictSkills }, { skillBindings: input.skillWhitelistIds.length }, true);
    if (!tightened) {
        return base;
    }
    if (input.skillWhitelistIds.length === 0) {
        return Object.assign(Object.assign({}, base), { id: -1 });
    }
    return Object.assign(Object.assign({}, base), { agentSkills: { some: { agentId: input.agentId } } });
}
exports.buildAgentSkillVisibilityWhere = buildAgentSkillVisibilityWhere;
//# sourceMappingURL=capability-candidate.util.js.map