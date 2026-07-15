"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeWorkflowExecutorOutcome = exports.applyWorkflowAfterSummarize = void 0;
const workflow_graph_routing_util_1 = require("./workflow-graph-routing.util");
const workflow_plan_sync_util_1 = require("./workflow-plan-sync.util");
const workflow_run_util_1 = require("./workflow-run.util");
const workflow_edge_util_1 = require("./graph/workflow-edge.util");
function summarizeCompletionOutputRef(action, nodeId) {
    if (action === 'present_mutation') {
        return `obs:present_mutation:${nodeId}`;
    }
    return `obs:summarize:${nodeId}`;
}
function isWorkflowSummarizeCompletionAction(action) {
    return action === 'summarize' || action === 'present_mutation';
}
function shouldCompleteWorkflowNodeAfterSummarize(action, run, input) {
    var _a, _b, _c, _d;
    if (action === 'present_mutation') {
        return true;
    }
    if (action !== 'summarize') {
        return false;
    }
    if (input.finished || !input.continuePlan) {
        return true;
    }
    if (((_c = (_b = (_a = run.routing) === null || _a === void 0 ? void 0 : _a.pendingNodeIds) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0) > 0) {
        return true;
    }
    const currentId = run.currentNodeId;
    if (!currentId || !((_d = run.edges) === null || _d === void 0 ? void 0 : _d.length)) {
        return false;
    }
    return (0, workflow_edge_util_1.listAlwaysEdgesFrom)(run.edges, currentId).some((edge) => {
        const target = run.nodes.find((row) => row.nodeId === edge.to);
        return (target === null || target === void 0 ? void 0 : target.status) === 'pending';
    });
}
function resolveWorkflowNodeIdByAction(defs, run, action, preferredId) {
    var _a;
    if (preferredId) {
        const preferred = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(defs, preferredId);
        if ((preferred === null || preferred === void 0 ? void 0 : preferred.action) === action) {
            return preferredId;
        }
    }
    const currentId = run.currentNodeId;
    if (currentId) {
        const current = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(defs, currentId);
        if ((current === null || current === void 0 ? void 0 : current.action) === action) {
            return currentId;
        }
    }
    const candidates = (defs !== null && defs !== void 0 ? defs : []).filter((node) => node.action === action);
    if (candidates.length === 0) {
        return null;
    }
    if (candidates.length === 1) {
        return candidates[0].id;
    }
    const active = candidates.find((node) => {
        const row = run.nodes.find((n) => n.nodeId === node.id);
        return (row === null || row === void 0 ? void 0 : row.status) === 'pending' || (row === null || row === void 0 ? void 0 : row.status) === 'running';
    });
    return (_a = active === null || active === void 0 ? void 0 : active.id) !== null && _a !== void 0 ? _a : candidates[0].id;
}
function isNodeTerminal(run, nodeId) {
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    return (node === null || node === void 0 ? void 0 : node.status) === 'succeeded' || (node === null || node === void 0 ? void 0 : node.status) === 'skipped';
}
function alignWorkflowRunForPresentSummarize(state, input) {
    const run = state.workflowRun;
    if (!run) {
        return null;
    }
    const presentNodeId = resolveWorkflowNodeIdByAction(state.workflowNodeDefs, run, 'present_mutation', input.summarizedPlanStepId);
    if (!presentNodeId) {
        return run;
    }
    if (run.currentNodeId === presentNodeId) {
        return run;
    }
    let aligned = run;
    const composeNodeId = resolveWorkflowNodeIdByAction(state.workflowNodeDefs, aligned, 'compose_mutation');
    if (composeNodeId && !isNodeTerminal(aligned, composeNodeId)) {
        if (aligned.currentNodeId === composeNodeId) {
            aligned = (0, workflow_plan_sync_util_1.completeWorkflowNodeFromSummarize)(aligned, composeNodeId, `obs:step:${composeNodeId}`);
        }
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
    if (!shouldCompleteWorkflowNodeAfterSummarize(action, run, input)) {
        return run !== state.workflowRun ? { workflowRun: run, workflowAwaitingReact: false } : {};
    }
    let workflowRun = (0, workflow_plan_sync_util_1.completeWorkflowNodeFromSummarize)(run, nodeId, summarizeCompletionOutputRef(action, nodeId));
    workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(workflowRun);
    workflowRun = (0, workflow_run_util_1.finalizeWorkflowRunAfterAdvance)(workflowRun);
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