"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldDeferPlanPresentWriteGate = exports.isWorkflowAwaitUserConfirmResume = exports.resolveApprovedWriteToolNamesAfterWorkflowAwait = exports.resolveWriteConfirmationPolicy = exports.workflowHasAwaitUserConfirmNode = void 0;
const risk_level_util_1 = require("../risk/risk-level.util");
const plan_compose_write_util_1 = require("../agent-engine/engine/main/plan-present/plan-compose-write.util");
const workflow_graph_routing_util_1 = require("./workflow-graph-routing.util");
function workflowAwaitNodeId(defs) {
    var _a, _b;
    return (_b = (_a = defs.find((row) => row.action === 'await_user_confirm')) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
}
function workflowHasAwaitUserConfirmNode(defs) {
    return workflowAwaitNodeId(defs !== null && defs !== void 0 ? defs : []) != null;
}
exports.workflowHasAwaitUserConfirmNode = workflowHasAwaitUserConfirmNode;
function isWorkflowNodeCompleted(run, nodeId) {
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    return (node === null || node === void 0 ? void 0 : node.status) === 'succeeded' || (node === null || node === void 0 ? void 0 : node.status) === 'skipped';
}
function resolveWriteConfirmationPolicy(input) {
    const defs = input.workflowNodeDefs;
    const run = input.workflowRun;
    if (!(defs === null || defs === void 0 ? void 0 : defs.length) || !(run === null || run === void 0 ? void 0 : run.currentNodeId)) {
        return { kind: 'gate_now' };
    }
    const awaitNodeId = workflowAwaitNodeId(defs);
    if (!awaitNodeId) {
        return { kind: 'gate_now' };
    }
    const currentDef = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(defs, run.currentNodeId);
    const awaitCompleted = isWorkflowNodeCompleted(run, awaitNodeId);
    if (awaitCompleted && (currentDef === null || currentDef === void 0 ? void 0 : currentDef.action) === 'write_data') {
        return { kind: 'bypass_after_workflow_await' };
    }
    if (!awaitCompleted && (currentDef === null || currentDef === void 0 ? void 0 : currentDef.action) !== 'await_user_confirm') {
        return { kind: 'defer_to_workflow_await' };
    }
    return { kind: 'gate_now' };
}
exports.resolveWriteConfirmationPolicy = resolveWriteConfirmationPolicy;
function readPositiveToolId(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return null;
    }
    const toolId = input.toolId;
    return typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0
        ? toolId
        : null;
}
function resolveApprovedWriteToolNamesAfterWorkflowAwait(input) {
    var _a, _b;
    const composed = (0, plan_compose_write_util_1.resolveLatestPlanComposeWrite)(input.observations);
    if ((_a = composed === null || composed === void 0 ? void 0 : composed.tool) === null || _a === void 0 ? void 0 : _a.trim()) {
        return [composed.tool.trim()];
    }
    const writeNode = (_b = input.workflowNodeDefs) === null || _b === void 0 ? void 0 : _b.find((row) => row.action === 'write_data');
    const toolId = readPositiveToolId(writeNode === null || writeNode === void 0 ? void 0 : writeNode.input);
    if (toolId != null) {
        const bound = input.scopedTools.find((tool) => tool.id === toolId);
        if (bound === null || bound === void 0 ? void 0 : bound.name) {
            return [bound.name];
        }
    }
    return input.scopedTools
        .filter((tool) => (0, risk_level_util_1.toolRequiresWriteConfirmation)({
        riskLevel: tool.riskLevel,
        agentMetadata: tool.agentMetadata,
    }))
        .map((tool) => tool.name);
}
exports.resolveApprovedWriteToolNamesAfterWorkflowAwait = resolveApprovedWriteToolNamesAfterWorkflowAwait;
function isWorkflowAwaitUserConfirmResume(input) {
    var _a;
    if (input.pendingToolCalls.length > 0 || !((_a = input.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId)) {
        return false;
    }
    const current = input.workflowRun.nodes.find((row) => { var _a; return row.nodeId === ((_a = input.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId); });
    return (current === null || current === void 0 ? void 0 : current.action) === 'await_user_confirm';
}
exports.isWorkflowAwaitUserConfirmResume = isWorkflowAwaitUserConfirmResume;
function shouldDeferPlanPresentWriteGate(input) {
    return (resolveWriteConfirmationPolicy({
        workflowRun: input.workflowRun,
        workflowNodeDefs: input.workflowNodeDefs,
    }).kind === 'defer_to_workflow_await');
}
exports.shouldDeferPlanPresentWriteGate = shouldDeferPlanPresentWriteGate;
//# sourceMappingURL=workflow-mutation-write-gate.util.js.map