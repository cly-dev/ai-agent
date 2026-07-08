"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allWorkflowNodesTerminal = exports.getWorkflowRunNode = exports.finalizeWorkflowRun = exports.advanceWorkflowRun = exports.skipWorkflowNode = exports.failWorkflowNode = exports.completeWorkflowNode = exports.startWorkflowNode = exports.initWorkflowRun = void 0;
function cloneRun(run) {
    return Object.assign(Object.assign({}, run), { nodes: run.nodes.map((node) => (Object.assign({}, node))) });
}
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
function nextPendingNodeId(run, afterNodeId) {
    const startIndex = afterNodeId == null ? 0 : findNodeIndex(run, afterNodeId) + 1;
    for (let index = startIndex; index < run.nodes.length; index += 1) {
        const node = run.nodes[index];
        if (node.status === 'pending') {
            return node.nodeId;
        }
    }
    return null;
}
function initWorkflowRun(input) {
    var _a, _b;
    if (input.nodes.length === 0) {
        throw new Error('workflow must contain at least one node');
    }
    const runNodes = input.nodes.map((node) => ({
        nodeId: node.id,
        action: node.action,
        name: node.name,
        status: 'pending',
    }));
    return {
        workflowId: input.workflowId,
        version: input.version,
        currentNodeId: (_b = (_a = input.nodes[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
        status: 'running',
        compiledFrom: input.compiledFrom,
        nodes: runNodes,
    };
}
exports.initWorkflowRun = initWorkflowRun;
function startWorkflowNode(run, nodeId, now = new Date().toISOString()) {
    var _a;
    const next = cloneRun(run);
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
    const next = cloneRun(run);
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
function failWorkflowNode(run, nodeId, error, now = new Date().toISOString()) {
    const next = cloneRun(run);
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
    const next = cloneRun(run);
    const index = assertNodeExists(next, nodeId);
    const node = next.nodes[index];
    node.status = 'skipped';
    node.finishedAt = now;
    return next;
}
exports.skipWorkflowNode = skipWorkflowNode;
function advanceWorkflowRun(run) {
    if (run.status === 'failed' || run.status === 'cancelled') {
        return run;
    }
    const next = cloneRun(run);
    const currentId = next.currentNodeId;
    if (currentId != null) {
        const current = next.nodes[findNodeIndex(next, currentId)];
        if (current &&
            current.status !== 'succeeded' &&
            current.status !== 'skipped') {
            throw new Error(`cannot advance: current node ${currentId} is ${current.status}`);
        }
    }
    const upcoming = nextPendingNodeId(next, currentId);
    next.currentNodeId = upcoming;
    return next;
}
exports.advanceWorkflowRun = advanceWorkflowRun;
function finalizeWorkflowRun(run, status) {
    const next = cloneRun(run);
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
//# sourceMappingURL=workflow-run.util.js.map