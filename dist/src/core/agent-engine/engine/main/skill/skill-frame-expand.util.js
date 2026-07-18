"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandPendingSkillStepIfNeeded = exports.filterDecisionHostToolsForSkill = void 0;
const skill_runnable_util_1 = require("../../../../skill/skill-runnable.util");
const requested_skill_run_error_1 = require("./requested-skill-run.error");
const plan_stack_util_1 = require("../plan/plan-stack.util");
const task_plan_llm_util_1 = require("../plan/task-plan-llm.util");
const task_plan_util_1 = require("../plan/task-plan.util");
function filterHostToolSummariesForSkill(hostTools, skill) {
    if (!hostTools || (0, skill_runnable_util_1.skillIsWorkflowBound)(skill) || skill.hostToolIds.length === 0) {
        return hostTools;
    }
    const allowedIds = new Set(skill.hostToolIds);
    return hostTools.filter((tool) => tool.id == null || allowedIds.has(tool.id));
}
function filterDecisionHostToolsForSkill(hostTools, skill) {
    if (!skill || (0, skill_runnable_util_1.skillIsWorkflowBound)(skill) || skill.hostToolIds.length === 0) {
        return hostTools;
    }
    const allowedIds = new Set(skill.hostToolIds);
    return hostTools.filter((tool) => allowedIds.has(tool.id));
}
exports.filterDecisionHostToolsForSkill = filterDecisionHostToolsForSkill;
function getPendingSkillStep(plan) {
    var _a;
    const stepId = (_a = plan.pendingStepIds[0]) !== null && _a !== void 0 ? _a : plan.currentStepId;
    if (!stepId) {
        return null;
    }
    const step = plan.steps.find((row) => row.id === stepId);
    if ((step === null || step === void 0 ? void 0 : step.kind) !== 'skill' || step.skillId == null) {
        return null;
    }
    return step;
}
function skillRowFromActiveFrame(frame, scopedTools) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!frame.skillId || !frame.skillName) {
        return null;
    }
    return {
        id: frame.skillId,
        name: frame.skillName,
        description: (_a = frame.skillDescription) !== null && _a !== void 0 ? _a : null,
        prompt: (_b = frame.skillPrompt) !== null && _b !== void 0 ? _b : '',
        config: (_c = frame.skillConfig) !== null && _c !== void 0 ? _c : null,
        riskLevel: (_d = frame.skillRiskLevel) !== null && _d !== void 0 ? _d : 'L1',
        capabilityKey: null,
        skillToolIds: (_e = frame.skillToolIds) !== null && _e !== void 0 ? _e : [],
        hostToolIds: (_f = frame.skillHostToolIds) !== null && _f !== void 0 ? _f : [],
        runnableKind: (_g = frame.skillRunnableKind) !== null && _g !== void 0 ? _g : 'http',
    };
}
function innerFrameFromSkillPlan(input) {
    return {
        frameId: `${input.parentSkillStepId}:skill:${input.skill.id}`,
        skillId: input.skill.id,
        skillName: input.skill.name,
        source: input.innerPlan.source,
        steps: input.innerPlan.steps,
        pendingStepIds: [...input.innerPlan.pendingStepIds],
        completedStepIds: [...input.innerPlan.completedStepIds],
        taskPhase: input.innerPlan.taskPhase,
        currentObjective: input.innerPlan.currentObjective,
        currentStepId: input.innerPlan.currentStepId,
        parentSkillStepId: input.parentSkillStepId,
        skillPrompt: input.skill.prompt,
        skillDescription: input.skill.description,
        skillConfig: input.skill.config,
        skillRiskLevel: input.skill.riskLevel,
        skillHostToolIds: input.skill.hostToolIds,
        skillToolIds: input.skill.skillToolIds,
        skillRunnableKind: input.skill.runnableKind,
    };
}
async function expandPendingSkillStepIfNeeded(input) {
    const base = {
        plan: input.plan,
        scopedTools: input.scopedTools,
        scopedAllowedToolIds: input.scopedTools.map((tool) => tool.id),
        scopedToolBundle: input.skillService.bindSkillToScopedTools({ skillToolIds: input.scopedTools.map((tool) => tool.id) }, input.scopedTools, input.toolBuildCtx).scopedToolBundle,
        skill: null,
    };
    if (!(0, plan_stack_util_1.isPendingSkillEntryStep)(input.plan)) {
        return base;
    }
    if ((0, plan_stack_util_1.isSkillFrameActiveForPendingStep)(input.plan)) {
        const frame = input.plan.frames[input.plan.activeFrameIndex];
        const skillRow = skillRowFromActiveFrame(frame, input.scopedTools);
        if (!skillRow) {
            return base;
        }
        const bind = input.skillService.bindSkillToScopedTools(skillRow, input.scopedTools, input.toolBuildCtx);
        return {
            plan: input.plan,
            scopedTools: bind.scopedTools,
            scopedAllowedToolIds: bind.scopedAllowedToolIds,
            scopedToolBundle: bind.scopedToolBundle,
            skill: skillRow,
        };
    }
    const skillStep = getPendingSkillStep(input.plan);
    if (!(skillStep === null || skillStep === void 0 ? void 0 : skillStep.skillId)) {
        return base;
    }
    const skill = await input.skillService.getRunnableSkillDetailById({
        agentId: input.agentId,
        userId: input.userId,
        appClientId: input.appClientId,
        skillId: skillStep.skillId,
        scopedTools: input.scopedTools,
        scopedHostToolIds: input.scopedHostToolIds,
        forRequestedSkill: input.enforceRequestedSkill === true,
    });
    if (!skill) {
        if (input.enforceRequestedSkill) {
            const skillId = skillStep.skillId;
            throw new requested_skill_run_error_1.RequestedSkillRunError('SKILL_EXPAND_FAILED', `requested skill ${skillId} could not be expanded into scoped tools`);
        }
        return Object.assign(Object.assign({}, base), { plan: (0, plan_stack_util_1.syncPlanFromActiveFrame)((0, plan_stack_util_1.applyActiveFrameStepComplete)(input.plan, skillStep.id)) });
    }
    const bind = input.skillService.bindSkillToScopedTools(skill, input.scopedTools, input.toolBuildCtx);
    const scopedSummaries = (0, task_plan_util_1.summarizeScopedToolsForPlan)(bind.scopedTools);
    const skillBoundWorkflowPlan = await input.skillService.tryBuildTaskPlanFromSkillWorkflow({
        appClientId: input.appClientId,
        userMessage: input.plan.originalUserRequest,
        skill,
        goal: input.plan.goal,
    });
    const innerResolved = await (0, task_plan_llm_util_1.resolveTaskPlan)({
        llmService: input.llmService,
        promptRegistry: input.promptRegistry,
        scope: input.scope,
        planInput: {
            userMessage: input.plan.originalUserRequest,
            scopedToolSummaries: scopedSummaries,
            skillApplied: true,
            skillName: skill.name,
            skillDescription: skill.description,
            skillConfig: skill.config,
            skillRiskLevel: skill.riskLevel,
            skillPrompt: skill.prompt,
            skillToolIds: skill.skillToolIds,
            skillHostToolIds: skill.hostToolIds,
            availableHostTools: filterHostToolSummariesForSkill(input.availableHostTools, skill),
            skillBoundWorkflowPlan,
        },
    });
    const innerPlan = innerResolved.plan;
    const childFrame = innerFrameFromSkillPlan({
        skill,
        parentSkillStepId: skillStep.id,
        innerPlan,
    });
    const plan = (0, plan_stack_util_1.pushPlanFrame)(input.plan, childFrame);
    return {
        plan: (0, plan_stack_util_1.syncPlanFromActiveFrame)(plan),
        scopedTools: bind.scopedTools,
        scopedAllowedToolIds: bind.scopedAllowedToolIds,
        scopedToolBundle: bind.scopedToolBundle,
        skill,
    };
}
exports.expandPendingSkillStepIfNeeded = expandPendingSkillStepIfNeeded;
//# sourceMappingURL=skill-frame-expand.util.js.map