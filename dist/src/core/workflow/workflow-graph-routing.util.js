"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeResultCheckWorkflowAxis = exports.routeAfterSummarizeWorkflowAxis = exports.routeAfterWorkflowAdvance = exports.routeAfterWorkflowReact = exports.routeAfterExecuteNode = exports.routeAfterWorkflowInit = exports.getCurrentWorkflowNode = exports.resolveWorkflowNodeDefForExecute = exports.getWorkflowNodeDef = void 0;
const workflow_ir_native_phase_util_1 = require("./workflow-ir-native-phase.util");
const turn_graph_util_1 = require("../agent-engine/engine/turn/turn-graph.util");
const workflow_plan_sync_util_1 = require("./workflow-plan-sync.util");
function getWorkflowNodeDef(defs, nodeId) {
    if (!defs || !nodeId) {
        return undefined;
    }
    return defs.find((row) => row.id === nodeId);
}
exports.getWorkflowNodeDef = getWorkflowNodeDef;
function resolveWorkflowNodeDefForExecute(input) {
    var _a, _b;
    if (input.executionMode === 'ir_native_direct' && input.ir) {
        const irNode = input.ir.nodes.find((row) => row.id === input.nodeId);
        if (irNode) {
            try {
                const phase = (_a = input.phase) !== null && _a !== void 0 ? _a : (0, workflow_ir_native_phase_util_1.resolveWorkflowIrNativePhases)(irNode)[0];
                return (0, workflow_ir_native_phase_util_1.materializeWorkflowIrNodeForPhase)(irNode, phase);
            }
            catch (_c) {
                return undefined;
            }
        }
    }
    return getWorkflowNodeDef((_b = input.defs) !== null && _b !== void 0 ? _b : undefined, input.nodeId);
}
exports.resolveWorkflowNodeDefForExecute = resolveWorkflowNodeDefForExecute;
function getCurrentWorkflowNode(state) {
    var _a;
    const run = state.workflowRun;
    if (!(run === null || run === void 0 ? void 0 : run.currentNodeId)) {
        return null;
    }
    return (_a = run.nodes.find((node) => node.nodeId === run.currentNodeId)) !== null && _a !== void 0 ? _a : null;
}
exports.getCurrentWorkflowNode = getCurrentWorkflowNode;
function routeAfterWorkflowInit(state) {
    var _a;
    if (state.finished) {
        return '__end__';
    }
    if ((0, turn_graph_util_1.shouldRouteToRespond)(state)) {
        return 'summarize';
    }
    if (!((_a = state.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId)) {
        return 'summarize';
    }
    return 'execute_node';
}
exports.routeAfterWorkflowInit = routeAfterWorkflowInit;
function routeAfterExecuteNode(state) {
    var _a;
    if (state.finished) {
        return '__end__';
    }
    if ((0, turn_graph_util_1.shouldRouteToRespond)(state)) {
        return 'summarize';
    }
    const current = getCurrentWorkflowNode(state);
    if ((current === null || current === void 0 ? void 0 : current.status) === 'failed') {
        return '__end__';
    }
    if ((current === null || current === void 0 ? void 0 : current.status) === 'succeeded' || (current === null || current === void 0 ? void 0 : current.status) === 'skipped') {
        return 'workflow_advance';
    }
    if (state.workflowAwaitingReact) {
        return 'workflow_react';
    }
    const nodeId = (_a = state.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId;
    if (!nodeId) {
        return 'workflow_advance';
    }
    const def = resolveWorkflowNodeDefForExecute({
        nodeId,
        defs: state.workflowNodeDefs,
        ir: state.workflowIr,
        executionMode: state.workflowExecutionMode,
        phase: current === null || current === void 0 ? void 0 : current.phase,
    });
    if ((def === null || def === void 0 ? void 0 : def.action) === 'summarize' || (def === null || def === void 0 ? void 0 : def.action) === 'present_mutation') {
        return 'summarize';
    }
    if ((0, workflow_plan_sync_util_1.workflowNodeRequiresReactLoop)(def)) {
        return 'workflow_react';
    }
    return 'workflow_advance';
}
exports.routeAfterExecuteNode = routeAfterExecuteNode;
function routeAfterWorkflowReact(state) {
    if (state.finished) {
        return '__end__';
    }
    if ((0, turn_graph_util_1.shouldRouteToRespond)(state)) {
        return 'summarize';
    }
    const current = getCurrentWorkflowNode(state);
    if ((current === null || current === void 0 ? void 0 : current.status) === 'failed') {
        return '__end__';
    }
    if ((current === null || current === void 0 ? void 0 : current.status) === 'succeeded' || (current === null || current === void 0 ? void 0 : current.status) === 'skipped') {
        return 'workflow_advance';
    }
    if (!state.workflowAwaitingReact) {
        if ((current === null || current === void 0 ? void 0 : current.status) === 'pending' || (current === null || current === void 0 ? void 0 : current.status) === 'running') {
            return 'execute_node';
        }
        return 'workflow_advance';
    }
    return 'summarize';
}
exports.routeAfterWorkflowReact = routeAfterWorkflowReact;
function routeAfterWorkflowAdvance(state) {
    if (state.finished) {
        return '__end__';
    }
    const run = state.workflowRun;
    if (!run || run.status === 'failed' || run.status === 'cancelled') {
        return '__end__';
    }
    if (run.status === 'completed' || !run.currentNodeId) {
        return '__end__';
    }
    return 'execute_node';
}
exports.routeAfterWorkflowAdvance = routeAfterWorkflowAdvance;
function routeAfterSummarizeWorkflowAxis(state, resumeFromWriteConfirm) {
    if (state.finished || resumeFromWriteConfirm) {
        return '__end__';
    }
    if (state.pendingToolCalls.length > 0) {
        return 'tools';
    }
    const run = state.workflowRun;
    if (run && run.status === 'running' && run.currentNodeId) {
        const current = getCurrentWorkflowNode(state);
        if ((current === null || current === void 0 ? void 0 : current.status) === 'succeeded' || (current === null || current === void 0 ? void 0 : current.status) === 'skipped') {
            return 'workflow_advance';
        }
        if (state.workflowAwaitingReact) {
            return 'workflow_react';
        }
        if ((current === null || current === void 0 ? void 0 : current.status) === 'pending' || (current === null || current === void 0 ? void 0 : current.status) === 'running') {
            return 'execute_node';
        }
    }
    return '__end__';
}
exports.routeAfterSummarizeWorkflowAxis = routeAfterSummarizeWorkflowAxis;
function routeResultCheckWorkflowAxis(state) {
    var _a;
    if (!((_a = state.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId)) {
        return null;
    }
    const current = getCurrentWorkflowNode(state);
    if ((current === null || current === void 0 ? void 0 : current.status) === 'succeeded' || (current === null || current === void 0 ? void 0 : current.status) === 'skipped') {
        return 'workflow_advance';
    }
    return null;
}
exports.routeResultCheckWorkflowAxis = routeResultCheckWorkflowAxis;
//# sourceMappingURL=workflow-graph-routing.util.js.map