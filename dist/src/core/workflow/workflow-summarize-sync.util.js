"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWorkflowExecutorOutcome = exports.applyWorkflowAfterSummarize = void 0;
const workflow_graph_routing_util_1 = require("./workflow-graph-routing.util");
const workflow_plan_sync_util_1 = require("./workflow-plan-sync.util");
const workflow_run_util_1 = require("./workflow-run.util");
function summarizeCompletionOutputRef(action, nodeId) {
    if (action === 'present_mutation') {
        return `obs:present_mutation:${nodeId}`;
    }
    return `obs:summarize:${nodeId}`;
}
function isWorkflowSummarizeCompletionAction(action) {
    return action === 'summarize' || action === 'present_mutation';
}
function shouldCompleteWorkflowNodeAfterSummarize(action, input) {
    if (action === 'present_mutation') {
        return true;
    }
    if (action === 'summarize') {
        return input.finished || !input.continuePlan;
    }
    return false;
}
function findWorkflowNodeIdByAction(defs, action) {
    var _a;
    const row = defs === null || defs === void 0 ? void 0 : defs.find((node) => node.action === action);
    return (_a = row === null || row === void 0 ? void 0 : row.id) !== null && _a !== void 0 ? _a : null;
}
function isNodeTerminal(run, nodeId) {
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    return (node === null || node === void 0 ? void 0 : node.status) === 'succeeded' || (node === null || node === void 0 ? void 0 : node.status) === 'skipped';
}
function alignWorkflowRunForPresentSummarize(state, input) {
    var _a;
    const run = state.workflowRun;
    if (!run) {
        return null;
    }
    const presentNodeId = input.summarizedPlanStepId &&
        ((_a = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(state.workflowNodeDefs, input.summarizedPlanStepId)) === null || _a === void 0 ? void 0 : _a.action) === 'present_mutation'
        ? input.summarizedPlanStepId
        : findWorkflowNodeIdByAction(state.workflowNodeDefs, 'present_mutation');
    if (!presentNodeId) {
        return run;
    }
    const currentDef = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(state.workflowNodeDefs, run.currentNodeId);
    if ((currentDef === null || currentDef === void 0 ? void 0 : currentDef.action) === 'present_mutation' && run.currentNodeId === presentNodeId) {
        return run;
    }
    let aligned = run;
    const composeNodeId = findWorkflowNodeIdByAction(state.workflowNodeDefs, 'compose_mutation');
    if (composeNodeId && !isNodeTerminal(aligned, composeNodeId)) {
        aligned = (0, workflow_plan_sync_util_1.completeWorkflowNodeFromSummarize)(aligned, composeNodeId, `obs:step:${composeNodeId}`);
    }
    return Object.assign(Object.assign({}, aligned), { currentNodeId: presentNodeId });
}
function applyWorkflowAfterSummarize(state, input) {
    var _a;
    let run = state.workflowRun;
    if (!run) {
        return {};
    }
    if (input.summarizedPlanStepId) {
        const presentDef = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(state.workflowNodeDefs, input.summarizedPlanStepId);
        if ((presentDef === null || presentDef === void 0 ? void 0 : presentDef.action) === 'present_mutation') {
            run = (_a = alignWorkflowRunForPresentSummarize(state, input)) !== null && _a !== void 0 ? _a : run;
        }
    }
    const nodeId = run.currentNodeId;
    if (!nodeId) {
        return { workflowRun: run };
    }
    const def = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(state.workflowNodeDefs, nodeId);
    const action = def === null || def === void 0 ? void 0 : def.action;
    if (!isWorkflowSummarizeCompletionAction(action)) {
        return run !== state.workflowRun ? { workflowRun: run, workflowAwaitingReact: false } : {};
    }
    if (!shouldCompleteWorkflowNodeAfterSummarize(action, input)) {
        return run !== state.workflowRun ? { workflowRun: run, workflowAwaitingReact: false } : {};
    }
    let workflowRun = (0, workflow_plan_sync_util_1.completeWorkflowNodeFromSummarize)(run, nodeId, summarizeCompletionOutputRef(action, nodeId));
    workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(workflowRun);
    if (workflowRun.currentNodeId == null && workflowRun.status === 'running') {
        workflowRun = (0, workflow_run_util_1.finalizeWorkflowRun)(workflowRun, 'completed');
    }
    return {
        workflowRun,
        workflowAwaitingReact: false,
    };
}
exports.applyWorkflowAfterSummarize = applyWorkflowAfterSummarize;
function mergeWorkflowExecutorOutcome(state, input) {
    var _a;
    const outputs = Object.assign({}, ((_a = state.workflowNodeOutputs) !== null && _a !== void 0 ? _a : {}));
    if (input.outputRef != null) {
        outputs[input.outputRef] = input.nodeOutput;
    }
    return Object.assign(Object.assign({}, state), { workflowRun: input.workflowRun, workflowNodeOutputs: outputs });
}
exports.mergeWorkflowExecutorOutcome = mergeWorkflowExecutorOutcome;
//# sourceMappingURL=workflow-summarize-sync.util.js.map