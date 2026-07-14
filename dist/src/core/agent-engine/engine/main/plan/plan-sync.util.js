"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planObservationBucketsFromState = exports.toPlanSyncAgentStep = exports.buildPlanSyncRunStep = exports.buildSkillFrameExpandedPlanSyncStep = exports.buildPlanRunStepOutput = exports.syncTaskPlanBeforeReAct = void 0;
const plan_observation_scope_util_1 = require("./plan-observation-scope.util");
Object.defineProperty(exports, "planObservationBucketsFromState", { enumerable: true, get: function () { return plan_observation_scope_util_1.planObservationBucketsFromState; } });
const workflow_plan_transition_util_1 = require("../../../../workflow/workflow-plan-transition.util");
const host_tool_run_step_util_1 = require("../host-tool/host-tool-run-step.util");
const task_plan_util_1 = require("./task-plan.util");
function syncTaskPlanBeforeReAct(input) {
    var _a, _b;
    if (!input.taskPlan) {
        return { taskPlan: null, planAdvance: null };
    }
    const observations = input.observationBuckets
        ? (0, plan_observation_scope_util_1.selectObservationsForPlanToolSatisfaction)(input.observationBuckets)
        : ((_a = input.runOwnedObservations) !== null && _a !== void 0 ? _a : []);
    const planAdvance = (0, task_plan_util_1.resolveTaskPlanAdvanceWhenStepSatisfied)({
        plan: input.taskPlan,
        observations,
        scopedTools: input.scopedTools,
        skillConfig: input.skillConfig,
        purpose: 'pre_tools_advance',
        pageContextEntityId: input.pageContextEntityId,
    });
    if (!planAdvance) {
        return { taskPlan: input.taskPlan, planAdvance: null };
    }
    if ((0, workflow_plan_transition_util_1.isWorkflowBoundRun)(input.workflowRun)) {
        const progressed = (0, workflow_plan_transition_util_1.applyPlanAdvanceAsWorkflowProgress)({
            taskPlan: input.taskPlan,
            workflowRun: input.workflowRun,
            workflowNodeDefs: input.workflowNodeDefs,
            workflowAwaitingReact: input.workflowAwaitingReact,
            planBefore: input.taskPlan,
            planAdvance,
        });
        return {
            taskPlan: (_b = progressed.taskPlan) !== null && _b !== void 0 ? _b : input.taskPlan,
            planAdvance,
            workflowRun: progressed.workflowRun,
            workflowAwaitingReact: progressed.workflowAwaitingReact,
        };
    }
    return {
        taskPlan: planAdvance.updatedPlan,
        planAdvance,
    };
}
exports.syncTaskPlanBeforeReAct = syncTaskPlanBeforeReAct;
function buildPlanRunStepOutput(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    const planHostStatus = (0, host_tool_run_step_util_1.resolveHostToolPlanRunStatus)({
        availableHostToolCount: input.availableHostToolCount,
        taskPlan: input.taskPlan,
    });
    return {
        method: input.method,
        llmFallbackReason: (_a = input.llmFallbackReason) !== null && _a !== void 0 ? _a : null,
        droppedHostToolStepIds: (_b = input.droppedHostToolStepIds) !== null && _b !== void 0 ? _b : [],
        prunedHostToolStepIds: (_c = input.prunedHostToolStepIds) !== null && _c !== void 0 ? _c : [],
        plannedHostToolStepIds: planHostStatus.plannedHostToolStepIds,
        hostToolRunStatus: planHostStatus.hostToolRunStatus,
        availableSkillIds: input.availableSkillIds,
        requestedSkillId: (_d = input.requestedSkillId) !== null && _d !== void 0 ? _d : null,
        requestedSkillEnforced: (_e = input.requestedSkillEnforced) !== null && _e !== void 0 ? _e : false,
        source: input.taskPlan.source,
        deliverable: input.taskPlan.deliverable,
        goal: input.taskPlan.goal,
        stepIds: input.taskPlan.steps.map((step) => step.id),
        pendingStepIds: input.taskPlan.pendingStepIds,
        currentStepId: input.taskPlan.currentStepId,
        currentObjective: input.taskPlan.currentObjective,
        taskPhase: input.taskPlan.taskPhase,
        activeFrameIndex: input.taskPlan.activeFrameIndex,
        frameCount: input.taskPlan.frames.length,
        skillFrameExpanded: (_f = input.skillFrameExpanded) !== null && _f !== void 0 ? _f : false,
        outerFrameCount: (_g = input.outerFrameCount) !== null && _g !== void 0 ? _g : input.taskPlan.frames.length,
        sessionWorkingMemoryIncluded: (_h = input.sessionWorkingMemoryIncluded) !== null && _h !== void 0 ? _h : false,
        availableHostToolCount: input.availableHostToolCount,
        availableHostToolNames: input.availableHostToolNames,
        outerSkillSelectMethod: (_j = input.outerSkillSelectMethod) !== null && _j !== void 0 ? _j : null,
        autoSelectedSkillId: (_k = input.autoSelectedSkillId) !== null && _k !== void 0 ? _k : null,
        turnRoute: (_l = input.turnRoute) !== null && _l !== void 0 ? _l : null,
        turnSkillSelect: (_m = input.turnSkillSelect) !== null && _m !== void 0 ? _m : null,
        pageContextPlan: (_o = input.pageContextPlan) !== null && _o !== void 0 ? _o : null,
        pageContextApplies: (_p = input.pageContextApplies) !== null && _p !== void 0 ? _p : false,
        pageContextTaskKind: (_q = input.pageContextTaskKind) !== null && _q !== void 0 ? _q : null,
        pageContextDataSufficiency: (_r = input.pageContextDataSufficiency) !== null && _r !== void 0 ? _r : null,
        planGoalInherited: (_s = input.planGoalInherited) !== null && _s !== void 0 ? _s : false,
        planGoal: (_t = input.planGoal) !== null && _t !== void 0 ? _t : input.taskPlan.goal,
        planGoalStrategy: (_u = input.planGoalStrategy) !== null && _u !== void 0 ? _u : null,
        sessionResumeAction: (_v = input.sessionResumeAction) !== null && _v !== void 0 ? _v : null,
        sessionResumeFollowUpReason: (_w = input.sessionResumeFollowUpReason) !== null && _w !== void 0 ? _w : null,
    };
}
exports.buildPlanRunStepOutput = buildPlanRunStepOutput;
function buildSkillFrameExpandedPlanSyncStep(input) {
    var _a;
    const planHostStatus = (0, host_tool_run_step_util_1.resolveHostToolPlanRunStatus)({
        availableHostToolCount: input.availableHostToolCount,
        taskPlan: input.taskPlan,
    });
    const planAdvance = {
        updatedPlan: input.taskPlan,
        route: 'llm',
        reason: 'skill_frame_expanded',
    };
    return {
        step: input.step,
        type: 'plan_sync',
        output: Object.assign({ site: 'readiness', reason: planAdvance.reason, route: planAdvance.route, fromStepId: null, toStepId: (_a = input.taskPlan.currentStepId) !== null && _a !== void 0 ? _a : null, pendingStepIds: input.taskPlan.pendingStepIds, frameCountBefore: input.frameCountBefore, frameCountAfter: input.taskPlan.frames.length, plannedHostToolStepIds: planHostStatus.plannedHostToolStepIds, hostToolRunStatus: planHostStatus.hostToolRunStatus, deliverable: input.taskPlan.deliverable, stepIds: input.taskPlan.steps.map((step) => step.id), availableHostToolCount: input.availableHostToolCount, availableHostToolNames: input.availableHostToolNames }, (input.planRunContext
            ? { planRunContext: input.planRunContext }
            : {})),
    };
}
exports.buildSkillFrameExpandedPlanSyncStep = buildSkillFrameExpandedPlanSyncStep;
function buildPlanSyncRunStep(input) {
    var _a;
    return {
        step: input.step,
        type: 'plan_sync',
        output: Object.assign({ site: input.site, reason: input.planAdvance.reason, route: input.planAdvance.route, fromStepId: input.fromStepId, toStepId: (_a = input.planAdvance.updatedPlan.currentStepId) !== null && _a !== void 0 ? _a : null, pendingStepIds: input.planAdvance.updatedPlan.pendingStepIds }, (input.planRunContext
            ? { planRunContext: input.planRunContext }
            : {})),
    };
}
exports.buildPlanSyncRunStep = buildPlanSyncRunStep;
function toPlanSyncAgentStep(input) {
    const base = buildPlanSyncRunStep({
        step: input.step,
        planAdvance: input.planAdvance,
        fromStepId: input.fromStepId,
        site: input.site,
        planRunContext: input.planRunContext,
    });
    const output = input.normalizeOutput(base.output);
    return Object.assign({ step: base.step, type: 'plan_sync' }, (output !== undefined ? { output } : {}));
}
exports.toPlanSyncAgentStep = toPlanSyncAgentStep;
//# sourceMappingURL=plan-sync.util.js.map