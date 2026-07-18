"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeWorkflowRunAfterAdvance = exports.allWorkflowNodesTerminal = exports.getWorkflowRunNode = exports.finalizeWorkflowRun = exports.advanceWorkflowRun = exports.skipWorkflowNode = exports.failWorkflowNode = exports.tryAdvanceNativePhaseAfterNodeSuccess = exports.completeWorkflowNodeOrAdvancePhase = exports.completeWorkflowNode = exports.startWorkflowNode = exports.initWorkflowRun = exports.cloneWorkflowRun = void 0;
const workflow_run_advance_util_1 = require("./graph/workflow-run-advance.util");
const workflow_edge_util_1 = require("./graph/workflow-edge.util");
const workflow_ir_native_phase_util_1 = require("./workflow-ir-native-phase.util");
function cloneWorkflowRun(run) {
    var _a;
    return Object.assign(Object.assign({}, run), { nodes: run.nodes.map((node) => (Object.assign({}, node))), edges: (_a = run.edges) === null || _a === void 0 ? void 0 : _a.map((edge) => (Object.assign(Object.assign({}, edge), { clue: edge.clue ? Object.assign({}, edge.clue) : undefined }))), routing: run.routing
            ? { pendingNodeIds: [...run.routing.pendingNodeIds] }
            : undefined });
}
exports.cloneWorkflowRun = cloneWorkflowRun;
function findNodeIndex(run, nodeId) {
    return run.nodes.findIndex((node) => node.nodeId === nodeId);
}
function assertNodeExists(run, nodeId) {
    const index = findNodeIndex(run, nodeId);
    if (index < 0) {
        throw new Error(`workflow node not found: ${nodeId}`);
    }
    return index;
}
function initWorkflowRun(input) {
    if (input.nodes.length === 0) {
        throw new Error('workflow must contain at least one node');
    }
    const runNodes = input.nodes.map((node) => {
        var _a;
        return (Object.assign(Object.assign(Object.assign({ nodeId: node.id, action: node.action, name: node.name, status: 'pending' }, (node.irNodeId ? { irNodeId: node.irNodeId } : {})), (node.irType ? { irType: node.irType } : {})), (((_a = input.phasesByNodeId) === null || _a === void 0 ? void 0 : _a[node.id])
            ? { phase: input.phasesByNodeId[node.id] }
            : {})));
    });
    const edges = input.edges != null
        ? input.edges
        : (0, workflow_edge_util_1.synthesizeLinearWorkflowEdges)(input.nodes);
    return {
        workflowId: input.workflowId,
        version: input.version,
        currentNodeId: (0, workflow_run_advance_util_1.resolveEntryNodeId)({
            nodes: input.nodes,
            entryNodeId: input.entryNodeId,
        }),
        status: 'running',
        compiledFrom: input.compiledFrom,
        nodes: runNodes,
        edges,
    };
}
exports.initWorkflowRun = initWorkflowRun;
function startWorkflowNode(run, nodeId, now = new Date().toISOString()) {
    var _a;
    const next = cloneWorkflowRun(run);
    const index = assertNodeExists(next, nodeId);
    const node = next.nodes[index];
    if (node.status !== 'pending' && node.status !== 'running') {
        throw new Error(`cannot start node in status ${node.status}`);
    }
    node.status = 'running';
    node.startedAt = (_a = node.startedAt) !== null && _a !== void 0 ? _a : now;
    next.currentNodeId = nodeId;
    return next;
}
exports.startWorkflowNode = startWorkflowNode;
function completeWorkflowNode(run, nodeId, outputRef, now = new Date().toISOString()) {
    const next = cloneWorkflowRun(run);
    const index = assertNodeExists(next, nodeId);
    const node = next.nodes[index];
    node.status = 'succeeded';
    node.finishedAt = now;
    if (outputRef != null) {
        node.outputRef = outputRef;
    }
    return next;
}
exports.completeWorkflowNode = completeWorkflowNode;
function completeWorkflowNodeOrAdvancePhase(input) {
    var _a, _b;
    const now = (_a = input.now) !== null && _a !== void 0 ? _a : new Date().toISOString();
    const current = input.run.nodes.find((n) => n.nodeId === input.nodeId);
    const currentPhase = (_b = current === null || current === void 0 ? void 0 : current.phase) !== null && _b !== void 0 ? _b : 'execute';
    const nextPhase = (0, workflow_ir_native_phase_util_1.nextWorkflowIrNativePhase)(input.irNode, currentPhase);
    if (nextPhase == null) {
        return {
            workflowRun: completeWorkflowNode(input.run, input.nodeId, input.outputRef, now),
            advancedPhase: false,
        };
    }
    const next = cloneWorkflowRun(input.run);
    const index = assertNodeExists(next, input.nodeId);
    const node = next.nodes[index];
    const phaseDef = (0, workflow_ir_native_phase_util_1.materializeWorkflowIrNodeForPhase)(input.irNode, nextPhase);
    node.phase = nextPhase;
    node.action = (0, workflow_ir_native_phase_util_1.actionForWorkflowIrNativePhase)(input.irNode, nextPhase);
    node.name = phaseDef.name;
    node.status = 'pending';
    delete node.startedAt;
    delete node.finishedAt;
    delete node.outputRef;
    delete node.error;
    next.currentNodeId = input.nodeId;
    next.status = 'running';
    return { workflowRun: next, advancedPhase: true };
}
exports.completeWorkflowNodeOrAdvancePhase = completeWorkflowNodeOrAdvancePhase;
function tryAdvanceNativePhaseAfterNodeSuccess(input) {
    var _a;
    const current = input.run.nodes.find((n) => n.nodeId === input.nodeId);
    const currentPhase = (_a = current === null || current === void 0 ? void 0 : current.phase) !== null && _a !== void 0 ? _a : 'execute';
    const nextPhase = (0, workflow_ir_native_phase_util_1.nextWorkflowIrNativePhase)(input.irNode, currentPhase);
    if (nextPhase == null) {
        return { workflowRun: input.run, advancedPhase: false };
    }
    return completeWorkflowNodeOrAdvancePhase({
        run: input.run,
        nodeId: input.nodeId,
        irNode: input.irNode,
    });
}
exports.tryAdvanceNativePhaseAfterNodeSuccess = tryAdvanceNativePhaseAfterNodeSuccess;
function failWorkflowNode(run, nodeId, error, now = new Date().toISOString()) {
    const next = cloneWorkflowRun(run);
    const index = assertNodeExists(next, nodeId);
    const node = next.nodes[index];
    node.status = 'failed';
    node.finishedAt = now;
    node.error = error;
    next.status = 'failed';
    next.currentNodeId = nodeId;
    return next;
}
exports.failWorkflowNode = failWorkflowNode;
function skipWorkflowNode(run, nodeId, now = new Date().toISOString()) {
    const next = cloneWorkflowRun(run);
    const index = assertNodeExists(next, nodeId);
    const node = next.nodes[index];
    node.status = 'skipped';
    node.finishedAt = now;
    return next;
}
exports.skipWorkflowNode = skipWorkflowNode;
function advanceWorkflowRun(run, edges) {
    if (run.status === 'failed' || run.status === 'cancelled') {
        return run;
    }
    const resolvedEdges = edges != null
        ? edges
        : run.edges != null
            ? run.edges
            : (0, workflow_edge_util_1.synthesizeLinearWorkflowEdges)(run.nodes.map((node) => ({
                id: node.nodeId,
                action: node.action,
                name: node.name,
                objective: '',
                input: {},
            })));
    return (0, workflow_run_advance_util_1.advanceWorkflowRunAlongEdges)({ run, edges: resolvedEdges });
}
exports.advanceWorkflowRun = advanceWorkflowRun;
function finalizeWorkflowRun(run, status) {
    const next = cloneWorkflowRun(run);
    next.status = status;
    if (status === 'completed') {
        next.currentNodeId = null;
    }
    return next;
}
exports.finalizeWorkflowRun = finalizeWorkflowRun;
function getWorkflowRunNode(run, nodeId) {
    var _a;
    return (_a = run.nodes.find((node) => node.nodeId === nodeId)) !== null && _a !== void 0 ? _a : null;
}
exports.getWorkflowRunNode = getWorkflowRunNode;
function allWorkflowNodesTerminal(run) {
    return run.nodes.every((node) => node.status === 'succeeded' ||
        node.status === 'failed' ||
        node.status === 'skipped');
}
exports.allWorkflowNodesTerminal = allWorkflowNodesTerminal;
function finalizeWorkflowRunAfterAdvance(run) {
    if (run.status !== 'running' || run.currentNodeId != null) {
        return run;
    }
    if (allWorkflowNodesTerminal(run)) {
        return finalizeWorkflowRun(run, 'completed');
    }
    const pendingIds = run.nodes
        .filter((node) => node.status === 'pending')
        .map((node) => node.nodeId);
    const next = finalizeWorkflowRun(run, 'failed');
    const now = new Date().toISOString();
    for (let i = 0; i < pendingIds.length; i += 1) {
        const nodeId = pendingIds[i];
        const index = next.nodes.findIndex((node) => node.nodeId === nodeId);
        if (index < 0) {
            continue;
        }
        if (i === 0) {
            next.nodes[index] = Object.assign(Object.assign({}, next.nodes[index]), { status: 'failed', finishedAt: now, error: {
                    code: 'WORKFLOW_ORPHAN_PENDING',
                    message: `workflow ended with pending nodes: ${pendingIds.join(', ')}`,
                } });
            next.currentNodeId = nodeId;
            continue;
        }
        next.nodes[index] = Object.assign(Object.assign({}, next.nodes[index]), { status: 'skipped', finishedAt: now });
    }
    return next;
}
exports.finalizeWorkflowRunAfterAdvance = finalizeWorkflowRunAfterAdvance;
//# sourceMappingURL=workflow-run.util.js.map