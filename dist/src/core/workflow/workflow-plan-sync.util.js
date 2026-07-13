"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeWorkflowNodeFromSummarize = exports.mirrorWorkflowRunAfterPlanAdvance = exports.ensureWorkflowNodeStarted = exports.syncTaskPlanAfterWorkflowNodeComplete = exports.projectTaskPlanFromWorkflowAdvance = exports.workflowNodeRequiresReactLoop = exports.deriveWorkflowAwaitingReact = exports.applyWorkflowTaskPlanProjection = exports.projectTaskPlanFromWorkflowRun = exports.syncWorkflowRunAfterPlanAdvance = exports.newlyCompletedPlanStepIds = void 0;
const task_plan_util_1 = require("../agent-engine/engine/main/plan/task-plan.util");
const plan_stack_util_1 = require("../agent-engine/engine/main/plan/plan-stack.util");
const workflow_resume_util_1 = require("./workflow-resume.util");
const workflow_run_util_1 = require("./workflow-run.util");
function newlyCompletedPlanStepIds(planBefore, planAfter) {
    const before = new Set(planBefore.completedStepIds);
    return planAfter.completedStepIds.filter((id) => !before.has(id));
}
exports.newlyCompletedPlanStepIds = newlyCompletedPlanStepIds;
function syncWorkflowRunAfterPlanAdvance(input) {
    let run = input.workflowRun;
    const completedIds = newlyCompletedPlanStepIds(input.planBefore, input.planAdvance.updatedPlan);
    for (const stepId of completedIds) {
        if (run.nodes.some((node) => node.nodeId === stepId)) {
            run = (0, workflow_run_util_1.completeWorkflowNode)(run, stepId, `obs:step:${stepId}`);
        }
    }
    const planAfter = input.planAdvance.updatedPlan;
    const nextStepId = planAfter.currentStepId;
    const currentId = run.currentNodeId;
    if (currentId != null) {
        const active = run.nodes.find((node) => node.nodeId === currentId);
        const planMovedPast = planAfter.completedStepIds.includes(currentId) ||
            !planAfter.pendingStepIds.includes(currentId);
        if ((active === null || active === void 0 ? void 0 : active.status) === 'running' && planMovedPast) {
            run = (0, workflow_run_util_1.completeWorkflowNode)(run, currentId, `obs:step:${currentId}`);
        }
    }
    if (nextStepId) {
        run = Object.assign(Object.assign({}, run), { currentNodeId: nextStepId });
        const nextNode = run.nodes.find((node) => node.nodeId === nextStepId);
        if ((nextNode === null || nextNode === void 0 ? void 0 : nextNode.status) === 'pending') {
            return run;
        }
        return (0, workflow_run_util_1.advanceWorkflowRun)(run);
    }
    if (run.status === 'running') {
        run = (0, workflow_run_util_1.advanceWorkflowRun)(run);
        if (run.currentNodeId == null) {
            run = (0, workflow_run_util_1.finalizeWorkflowRun)(run, 'completed');
        }
    }
    return run;
}
exports.syncWorkflowRunAfterPlanAdvance = syncWorkflowRunAfterPlanAdvance;
function projectTaskPlanFromWorkflowRun(input) {
    var _a, _b, _c, _d, _e;
    if (!input.taskPlan) {
        return null;
    }
    const plan = (_a = (0, workflow_resume_util_1.hydrateTaskPlanWithWorkflowDefs)({
        taskPlan: input.taskPlan,
        workflowNodeDefs: input.workflowNodeDefs,
    })) !== null && _a !== void 0 ? _a : input.taskPlan;
    const completedFromRun = new Set(input.workflowRun.nodes
        .filter((row) => row.status === 'succeeded' || row.status === 'skipped')
        .map((row) => row.nodeId));
    const priorCompleted = new Set(plan.completedStepIds);
    const stepIds = plan.steps.map((row) => row.id);
    const completedStepIds = stepIds.filter((id) => completedFromRun.has(id) || priorCompleted.has(id));
    const completedSet = new Set(completedStepIds);
    const pendingStepIds = stepIds.filter((id) => !completedSet.has(id));
    const currentNodeId = input.workflowRun.currentNodeId;
    let orderedPending = pendingStepIds;
    if (currentNodeId && pendingStepIds.includes(currentNodeId)) {
        orderedPending = [
            currentNodeId,
            ...pendingStepIds.filter((id) => id !== currentNodeId),
        ];
    }
    const currentStepId = currentNodeId && plan.steps.some((row) => row.id === currentNodeId)
        ? currentNodeId
        : (_b = orderedPending[0]) !== null && _b !== void 0 ? _b : null;
    const currentStep = currentStepId != null
        ? (_c = plan.steps.find((row) => row.id === currentStepId)) !== null && _c !== void 0 ? _c : null
        : null;
    const projectedFields = {
        completedStepIds,
        pendingStepIds: orderedPending,
        currentStepId,
        currentObjective: (_d = currentStep === null || currentStep === void 0 ? void 0 : currentStep.objective) !== null && _d !== void 0 ? _d : plan.currentObjective,
        taskPhase: (_e = currentStep === null || currentStep === void 0 ? void 0 : currentStep.phase) !== null && _e !== void 0 ? _e : plan.taskPhase,
    };
    if (plan.frames.length === 0) {
        return Object.assign(Object.assign({}, plan), projectedFields);
    }
    const frames = plan.frames.map((frame, index) => index === plan.activeFrameIndex
        ? Object.assign(Object.assign({}, frame), projectedFields) : frame);
    return (0, plan_stack_util_1.syncPlanFromActiveFrame)(Object.assign(Object.assign({}, plan), { frames }));
}
exports.projectTaskPlanFromWorkflowRun = projectTaskPlanFromWorkflowRun;
function applyWorkflowTaskPlanProjection(state) {
    if (!state.taskPlan || !state.workflowRun) {
        return state;
    }
    const taskPlan = projectTaskPlanFromWorkflowRun({
        taskPlan: state.taskPlan,
        workflowRun: state.workflowRun,
        workflowNodeDefs: state.workflowNodeDefs,
    });
    return taskPlan ? Object.assign(Object.assign({}, state), { taskPlan }) : state;
}
exports.applyWorkflowTaskPlanProjection = applyWorkflowTaskPlanProjection;
function deriveWorkflowAwaitingReact(input) {
    var _a;
    const run = input.workflowRun;
    const nodeId = run === null || run === void 0 ? void 0 : run.currentNodeId;
    if (!run || !nodeId || run.status !== 'running') {
        return false;
    }
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    if ((node === null || node === void 0 ? void 0 : node.status) !== 'running' && (node === null || node === void 0 ? void 0 : node.status) !== 'pending') {
        return false;
    }
    const def = (_a = input.workflowNodeDefs) === null || _a === void 0 ? void 0 : _a.find((row) => row.id === nodeId);
    return workflowNodeRequiresReactLoop(def);
}
exports.deriveWorkflowAwaitingReact = deriveWorkflowAwaitingReact;
function workflowNodeRequiresReactLoop(def) {
    if (!def) {
        return false;
    }
    return (def.action === 'fetch_data' ||
        def.action === 'generate_and_push' ||
        def.action === 'compose_mutation' ||
        def.action === 'write_data');
}
exports.workflowNodeRequiresReactLoop = workflowNodeRequiresReactLoop;
function projectTaskPlanFromWorkflowAdvance(input) {
    return syncTaskPlanAfterWorkflowNodeComplete(input);
}
exports.projectTaskPlanFromWorkflowAdvance = projectTaskPlanFromWorkflowAdvance;
function syncTaskPlanAfterWorkflowNodeComplete(input) {
    if (!input.taskPlan) {
        return null;
    }
    if (input.taskPlan.completedStepIds.includes(input.completedNodeId)) {
        return input.taskPlan;
    }
    const hasStep = input.taskPlan.steps.some((row) => row.id === input.completedNodeId);
    if (!hasStep) {
        return input.taskPlan;
    }
    const plan = input.taskPlan.frames.length === 0
        ? (0, plan_stack_util_1.wrapSnapshotWithPlanStack)(input.taskPlan)
        : input.taskPlan;
    return (0, task_plan_util_1.advancePlanAfterStepComplete)(plan, input.completedNodeId).updatedPlan;
}
exports.syncTaskPlanAfterWorkflowNodeComplete = syncTaskPlanAfterWorkflowNodeComplete;
function ensureWorkflowNodeStarted(run, nodeId, now) {
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    if (!node || node.status !== 'pending') {
        return run;
    }
    return (0, workflow_run_util_1.startWorkflowNode)(run, nodeId, now);
}
exports.ensureWorkflowNodeStarted = ensureWorkflowNodeStarted;
function mirrorWorkflowRunAfterPlanAdvance(input) {
    return syncWorkflowRunAfterPlanAdvance({
        workflowRun: input.workflowRun,
        planBefore: input.planBefore,
        planAdvance: input.planAdvance,
    });
}
exports.mirrorWorkflowRunAfterPlanAdvance = mirrorWorkflowRunAfterPlanAdvance;
function completeWorkflowNodeFromSummarize(run, nodeId, outputRef, now) {
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    if (!node || node.status === 'succeeded' || node.status === 'skipped') {
        return run;
    }
    return (0, workflow_run_util_1.completeWorkflowNode)(run, nodeId, outputRef !== null && outputRef !== void 0 ? outputRef : `obs:summarize:${nodeId}`, now);
}
exports.completeWorkflowNodeFromSummarize = completeWorkflowNodeFromSummarize;
//# sourceMappingURL=workflow-plan-sync.util.js.map