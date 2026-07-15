"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkflowResumeGraphSlice = exports.workflowRunHasPendingNodes = exports.advanceWorkflowRunAfterWriteConfirm = exports.prepareTaskPlanForWorkflowWriteConfirmResume = exports.hydrateTaskPlanWithWorkflowDefs = exports.shouldAwaitReactOnWorkflowResume = exports.resolveWorkflowGraphForResume = exports.isResumableWorkflowRun = void 0;
const normalize_task_plan_for_workflow_util_1 = require("./normalize-task-plan-for-workflow.util");
const compile_plan_to_workflow_util_1 = require("./compile-plan-to-workflow.util");
const load_workflow_definition_util_1 = require("./load-workflow-definition.util");
const workflow_plan_sync_util_1 = require("./workflow-plan-sync.util");
const workflow_run_util_1 = require("./workflow-run.util");
function isResumableWorkflowRun(run) {
    if (!run) {
        return false;
    }
    if (run.status === 'completed' || run.status === 'cancelled') {
        return false;
    }
    return run.nodes.length > 0;
}
exports.isResumableWorkflowRun = isResumableWorkflowRun;
function nodeDefsCoverRun(defs, run) {
    const defIds = new Set(defs.map((row) => row.id));
    return run.nodes.every((row) => defIds.has(row.nodeId));
}
async function resolveWorkflowGraphForResume(prisma, input) {
    if (input.savedRun.workflowId > 0) {
        const loaded = await (0, load_workflow_definition_util_1.loadWorkflowForRun)(prisma, {
            workflowId: input.savedRun.workflowId,
            appClientId: input.appClientId,
            workflowVersion: input.savedRun.version,
            scope: input.scope,
        });
        if (loaded && nodeDefsCoverRun(loaded.nodes, input.savedRun)) {
            return { nodes: loaded.nodes, edges: loaded.edges };
        }
    }
    const fromPlan = (0, compile_plan_to_workflow_util_1.compileTaskPlanToWorkflowNodes)(input.taskPlan.steps);
    if (fromPlan.length > 0 && nodeDefsCoverRun(fromPlan, input.savedRun)) {
        return { nodes: fromPlan, edges: null };
    }
    const runNodeIds = new Set(input.savedRun.nodes.map((row) => row.nodeId));
    const matched = fromPlan.filter((row) => runNodeIds.has(row.id));
    return matched.length > 0 ? { nodes: matched, edges: null } : null;
}
exports.resolveWorkflowGraphForResume = resolveWorkflowGraphForResume;
function shouldAwaitReactOnWorkflowResume(run, defs) {
    const nodeId = run.currentNodeId;
    if (!nodeId) {
        return false;
    }
    const nodeState = run.nodes.find((row) => row.nodeId === nodeId);
    if ((nodeState === null || nodeState === void 0 ? void 0 : nodeState.status) !== 'running' && (nodeState === null || nodeState === void 0 ? void 0 : nodeState.status) !== 'pending') {
        return false;
    }
    const def = defs.find((row) => row.id === nodeId);
    return (0, workflow_plan_sync_util_1.workflowNodeRequiresReactLoop)(def);
}
exports.shouldAwaitReactOnWorkflowResume = shouldAwaitReactOnWorkflowResume;
function hydrateTaskPlanWithWorkflowDefs(input) {
    var _a, _b;
    if (!input.taskPlan || !((_a = input.workflowNodeDefs) === null || _a === void 0 ? void 0 : _a.length)) {
        return (_b = input.taskPlan) !== null && _b !== void 0 ? _b : null;
    }
    return (0, normalize_task_plan_for_workflow_util_1.normalizeTaskPlanSnapshotForWorkflow)({
        plan: input.taskPlan,
        nodes: input.workflowNodeDefs,
    });
}
exports.hydrateTaskPlanWithWorkflowDefs = hydrateTaskPlanWithWorkflowDefs;
function prepareTaskPlanForWorkflowWriteConfirmResume(input) {
    var _a;
    if (!input.taskPlan) {
        return null;
    }
    const workflowRun = (_a = input.workflowRunAfterAdvance) !== null && _a !== void 0 ? _a : input.workflowRunBeforeAdvance;
    return (0, workflow_plan_sync_util_1.projectTaskPlanFromWorkflowRun)({
        taskPlan: input.taskPlan,
        workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
    });
}
exports.prepareTaskPlanForWorkflowWriteConfirmResume = prepareTaskPlanForWorkflowWriteConfirmResume;
function advanceWorkflowRunAfterWriteConfirm(run) {
    const currentId = run.currentNodeId;
    if (!currentId) {
        return run;
    }
    const current = run.nodes.find((row) => row.nodeId === currentId);
    if (!current ||
        (current.action !== 'await_user_confirm' && current.action !== 'write_data')) {
        return run;
    }
    let next = (0, workflow_run_util_1.completeWorkflowNode)(run, currentId, `obs:write_confirm:${currentId}`);
    next = (0, workflow_run_util_1.advanceWorkflowRun)(next);
    next = (0, workflow_run_util_1.finalizeWorkflowRunAfterAdvance)(next);
    return next;
}
exports.advanceWorkflowRunAfterWriteConfirm = advanceWorkflowRunAfterWriteConfirm;
function workflowRunHasPendingNodes(run) {
    return (run === null || run === void 0 ? void 0 : run.status) === 'running' && run.currentNodeId != null;
}
exports.workflowRunHasPendingNodes = workflowRunHasPendingNodes;
function buildWorkflowResumeGraphSlice(input) {
    const workflowRun = input.edges != null
        ? Object.assign(Object.assign({}, input.savedRun), { edges: input.edges }) : input.savedRun;
    return {
        workflowRun,
        workflowNodeDefs: input.nodes,
        workflowAwaitingReact: shouldAwaitReactOnWorkflowResume(workflowRun, input.nodes),
    };
}
exports.buildWorkflowResumeGraphSlice = buildWorkflowResumeGraphSlice;
//# sourceMappingURL=workflow-resume.util.js.map