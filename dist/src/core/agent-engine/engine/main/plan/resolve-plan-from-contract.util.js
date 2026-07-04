"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePlanFromContract = void 0;
const task_plan_llm_util_1 = require("./task-plan-llm.util");
const task_plan_util_1 = require("./task-plan.util");
async function resolvePlanFromContract(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { contract, planInput } = input;
    if (!contract.plan.enabled) {
        throw new Error('resolvePlanFromContract called while contract.plan.enabled is false');
    }
    if (contract.routing.route === 'direct_answer') {
        return (0, task_plan_util_1.buildChitchatPlanResult)({ userMessage: planInput.userMessage });
    }
    if (contract.routing.llmWriteChannel === 'none') {
        if (contract.plan.pageContextPlan === 'inline_answer') {
            return (0, task_plan_util_1.buildPageContextInlinePlanResult)({
                userMessage: planInput.userMessage,
                pageContextUsage: contract.plan.pageContextUsage,
            });
        }
        if (contract.plan.pageContextPlan === 'entity_read_detail') {
            return (0, task_plan_util_1.buildPageContextEntityReadPlanResult)({
                userMessage: planInput.userMessage,
                scopedToolSummaries: planInput.scopedToolSummaries,
                pageContextUsage: contract.plan.pageContextUsage,
            });
        }
    }
    switch (contract.plan.skillSelect) {
        case 'explicit': {
            const skillId = (_a = contract.plan.explicitSkillId) !== null && _a !== void 0 ? _a : planInput.requestedSkillId;
            if (skillId == null) {
                throw new Error('turn contract skillSelect=explicit but explicitSkillId is null');
            }
            return (0, task_plan_llm_util_1.resolveRequestedSkillOuterPlan)(Object.assign(Object.assign({}, planInput), { requestedSkillId: skillId }));
        }
        case 'page_host': {
            const skill = (_c = (_b = input.autoSkillCandidate) === null || _b === void 0 ? void 0 : _b.skill) !== null && _c !== void 0 ? _c : planInput.availableSkills.find((row) => row.id === contract.plan.pageHostSkillId);
            if (!skill) {
                throw new Error('turn contract skillSelect=page_host but page host skill is missing');
            }
            return (0, task_plan_util_1.buildRequestedSkillOuterPlanResult)({
                userMessage: planInput.userMessage,
                skill: {
                    id: skill.id,
                    name: skill.name,
                    description: skill.description,
                    riskLevel: skill.riskLevel,
                    config: 'config' in skill ? skill.config : undefined,
                    skillToolIds: 'skillToolIds' in skill ? skill.skillToolIds : undefined,
                    hostToolIds: skill.hostToolIds,
                },
                scopedToolSummaries: planInput.scopedToolSummaries,
                pageHostPrimary: true,
                outerSkillSelectMethod: 'page_host_unique',
            });
        }
        case 'llm':
        default:
            if (contract.routing.llmWriteChannel === 'host' &&
                contract.plan.allowHostToolSteps &&
                ((_e = (_d = planInput.availableHostTools) === null || _d === void 0 ? void 0 : _d.length) !== null && _e !== void 0 ? _e : 0) > 0) {
                const suggestedSkill = contract.routing.suggestedSkillId != null
                    ? planInput.availableSkills.find((skill) => skill.id === contract.routing.suggestedSkillId)
                    : null;
                const suggestedHostToolIds = new Set((_f = suggestedSkill === null || suggestedSkill === void 0 ? void 0 : suggestedSkill.hostToolIds) !== null && _f !== void 0 ? _f : []);
                const suggestedHostTools = suggestedHostToolIds.size > 0
                    ? ((_g = planInput.availableHostTools) !== null && _g !== void 0 ? _g : []).filter((tool) => tool.id != null && suggestedHostToolIds.has(tool.id))
                    : [];
                return (0, task_plan_util_1.buildHostToolWritePlanResult)({
                    userMessage: planInput.userMessage,
                    availableHostTools: suggestedHostTools.length > 0
                        ? suggestedHostTools
                        : ((_h = planInput.availableHostTools) !== null && _h !== void 0 ? _h : []),
                });
            }
            return (0, task_plan_llm_util_1.resolveOuterPlan)({
                llmService: input.llmService,
                promptRegistry: input.promptRegistry,
                scope: input.scope,
                planInput: Object.assign(Object.assign({}, planInput), { requestedSkillId: undefined, requestedSkillDetail: undefined }),
            });
    }
}
exports.resolvePlanFromContract = resolvePlanFromContract;
//# sourceMappingURL=resolve-plan-from-contract.util.js.map