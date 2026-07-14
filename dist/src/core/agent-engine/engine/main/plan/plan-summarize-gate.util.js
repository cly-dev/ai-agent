"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planSummarizeHasToolEvidence = exports.resolvePlanGatherRewindWhenToolsMissing = exports.applyPlanSummarizeRewind = exports.assessPlanSummarizeGate = exports.rewindWorkflowRunToPlanStep = exports.rewindPlanToGatherStep = exports.firstUnsatisfiedGatherToolStep = exports.planSummarizeRequiresToolEvidence = void 0;
const workflow_plan_sync_util_1 = require("../../../../workflow/workflow-plan-sync.util");
const workflow_run_util_1 = require("../../../../workflow/workflow-run.util");
const plan_observation_scope_util_1 = require("./plan-observation-scope.util");
const plan_stack_util_1 = require("./plan-stack.util");
const task_plan_util_1 = require("./task-plan.util");
function planSummarizeRequiresToolEvidence(plan) {
    if (!plan || (0, task_plan_util_1.planHasChitchatConstraint)(plan)) {
        return false;
    }
    if (plan.constraints.includes('page_context_inline')) {
        return false;
    }
    return plan.steps.some((step) => step.kind === 'tool' && step.phase === 'gather' && step.toolRole);
}
exports.planSummarizeRequiresToolEvidence = planSummarizeRequiresToolEvidence;
function firstUnsatisfiedGatherToolStep(input) {
    for (const step of input.plan.steps) {
        if (step.kind !== 'tool' || step.phase !== 'gather' || !step.toolRole) {
            continue;
        }
        if (!(0, task_plan_util_1.isPlanToolStepSatisfiedByObservations)({
            step,
            observations: input.observations,
            scopedTools: input.scopedTools,
            taskPlan: input.plan,
            purpose: 'observation_bucket',
        })) {
            return step;
        }
    }
    return null;
}
exports.firstUnsatisfiedGatherToolStep = firstUnsatisfiedGatherToolStep;
function rewindPlanToGatherStep(plan, gatherStepId) {
    const normalized = plan.frames.length === 0 ? (0, plan_stack_util_1.wrapSnapshotWithPlanStack)(plan) : plan;
    const gatherIndex = normalized.steps.findIndex((step) => step.id === gatherStepId);
    if (gatherIndex < 0) {
        return plan;
    }
    const pendingStepIds = normalized.steps.slice(gatherIndex).map((step) => step.id);
    const completedStepIds = normalized.steps.slice(0, gatherIndex).map((step) => step.id);
    const current = normalized.steps[gatherIndex];
    return (0, plan_stack_util_1.syncPlanFromActiveFrame)((0, plan_stack_util_1.updateActivePlanFrame)(normalized, (frame) => (Object.assign(Object.assign({}, frame), { pendingStepIds,
        completedStepIds, currentStepId: current.id, currentObjective: current.objective, taskPhase: current.phase }))));
}
exports.rewindPlanToGatherStep = rewindPlanToGatherStep;
function rewindWorkflowRunToPlanStep(input) {
    var _a;
    const stepIndex = input.plan.steps.findIndex((step) => step.id === input.stepId);
    if (stepIndex < 0) {
        return { workflowRun: input.workflowRun, workflowAwaitingReact: false };
    }
    const rewindIds = new Set(input.plan.steps.slice(stepIndex).map((step) => step.id));
    const resetRun = Object.assign(Object.assign({}, input.workflowRun), { status: 'running', nodes: input.workflowRun.nodes.map((node) => {
            if (!rewindIds.has(node.nodeId)) {
                return node;
            }
            return {
                nodeId: node.nodeId,
                action: node.action,
                name: node.name,
                status: 'pending',
            };
        }) });
    const workflowRun = (0, workflow_run_util_1.startWorkflowNode)(resetRun, input.stepId);
    const def = (_a = input.workflowNodeDefs) === null || _a === void 0 ? void 0 : _a.find((row) => row.id === input.stepId);
    return {
        workflowRun,
        workflowAwaitingReact: (0, workflow_plan_sync_util_1.workflowNodeRequiresReactLoop)(def),
    };
}
exports.rewindWorkflowRunToPlanStep = rewindWorkflowRunToPlanStep;
function assessPlanSummarizeGate(input) {
    var _a;
    const plan = input.plan;
    if (!plan ||
        !(0, task_plan_util_1.isPendingPlanAnswerStep)(plan, input.workflowRun, input.workflowNodeDefs)) {
        return { status: 'not_answer_step' };
    }
    if (!planSummarizeRequiresToolEvidence(plan)) {
        return { status: 'allowed', reason: 'no_gather_required' };
    }
    const summarizeObservations = [
        ...input.observationBuckets.preloaded,
        ...input.observationBuckets.runOwned,
    ];
    const strict = (0, task_plan_util_1.filterObservationsForPlanSummarize)({
        plan,
        observations: summarizeObservations,
        scopedTools: input.scopedTools,
        strict: true,
        workflowRun: input.workflowRun,
    });
    if (strict.observations.length > 0 && !strict.filterMiss) {
        return { status: 'allowed', reason: 'gather_evidence_present' };
    }
    const satisfactionObservations = (0, plan_observation_scope_util_1.selectObservationsForPlanToolSatisfaction)(input.observationBuckets);
    const unsatisfied = (_a = firstUnsatisfiedGatherToolStep({
        plan,
        observations: satisfactionObservations,
        scopedTools: input.scopedTools,
    })) !== null && _a !== void 0 ? _a : plan.steps.find((step) => step.kind === 'tool' && step.phase === 'gather' && step.toolRole);
    if (!unsatisfied) {
        return { status: 'allowed', reason: 'no_gather_required' };
    }
    return {
        status: 'rewind_gather',
        reason: 'gather_unsatisfied',
        rewindPlan: rewindPlanToGatherStep(plan, unsatisfied.id),
        gatherStepId: unsatisfied.id,
    };
}
exports.assessPlanSummarizeGate = assessPlanSummarizeGate;
function applyPlanSummarizeRewind(state, gate) {
    let next = Object.assign(Object.assign({}, state), { taskPlan: gate.rewindPlan, pendingRespond: null });
    if (next.workflowRun) {
        const aligned = rewindWorkflowRunToPlanStep({
            workflowRun: next.workflowRun,
            plan: gate.rewindPlan,
            stepId: gate.gatherStepId,
            workflowNodeDefs: next.workflowNodeDefs,
        });
        next = Object.assign(Object.assign({}, next), { workflowRun: aligned.workflowRun, workflowAwaitingReact: aligned.workflowAwaitingReact });
    }
    return next;
}
exports.applyPlanSummarizeRewind = applyPlanSummarizeRewind;
function resolvePlanGatherRewindWhenToolsMissing(input) {
    var _a;
    const plan = input.plan;
    if (!plan || !planSummarizeRequiresToolEvidence(plan)) {
        return null;
    }
    if (planSummarizeHasToolEvidence({
        plan,
        observationBuckets: input.observationBuckets,
        scopedTools: input.scopedTools,
        workflowRun: input.workflowRun,
    })) {
        return null;
    }
    const satisfactionObservations = (0, plan_observation_scope_util_1.selectObservationsForPlanToolSatisfaction)(input.observationBuckets);
    const unsatisfied = (_a = firstUnsatisfiedGatherToolStep({
        plan,
        observations: satisfactionObservations,
        scopedTools: input.scopedTools,
    })) !== null && _a !== void 0 ? _a : (0, task_plan_util_1.getPendingPlanToolStep)(plan, input.workflowRun);
    if (!unsatisfied ||
        unsatisfied.kind !== 'tool' ||
        unsatisfied.phase !== 'gather') {
        return null;
    }
    return {
        status: 'rewind_gather',
        reason: 'gather_unsatisfied',
        rewindPlan: rewindPlanToGatherStep(plan, unsatisfied.id),
        gatherStepId: unsatisfied.id,
    };
}
exports.resolvePlanGatherRewindWhenToolsMissing = resolvePlanGatherRewindWhenToolsMissing;
function planSummarizeHasToolEvidence(input) {
    if (!planSummarizeRequiresToolEvidence(input.plan)) {
        return true;
    }
    const strict = (0, task_plan_util_1.filterObservationsForPlanSummarize)({
        plan: input.plan,
        observations: [
            ...input.observationBuckets.preloaded,
            ...input.observationBuckets.runOwned,
        ],
        scopedTools: input.scopedTools,
        strict: true,
        workflowRun: input.workflowRun,
    });
    return strict.observations.length > 0 && !strict.filterMiss;
}
exports.planSummarizeHasToolEvidence = planSummarizeHasToolEvidence;
//# sourceMappingURL=plan-summarize-gate.util.js.map