"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEntryNodeId = exports.advanceWorkflowRunAlongEdges = exports.applyDetectCluesRouting = void 0;
const workflow_edge_util_1 = require("./workflow-edge.util");
function cloneRun(run) {
    return Object.assign(Object.assign({}, run), { nodes: run.nodes.map((node) => (Object.assign({}, node))), routing: run.routing
            ? { pendingNodeIds: [...run.routing.pendingNodeIds] }
            : undefined });
}
function skipPendingNode(run, nodeId, now) {
    const node = run.nodes.find((row) => row.nodeId === nodeId);
    if (!node || node.status !== 'pending') {
        return run;
    }
    const next = cloneRun(run);
    const target = next.nodes.find((row) => row.nodeId === nodeId);
    target.status = 'skipped';
    target.finishedAt = now;
    return next;
}
function collectAlwaysReachable(roots, edges) {
    const reachable = new Set();
    const stack = [...roots];
    while (stack.length > 0) {
        const id = stack.pop();
        if (reachable.has(id)) {
            continue;
        }
        reachable.add(id);
        for (const edge of (0, workflow_edge_util_1.listAlwaysEdgesFrom)(edges, id)) {
            stack.push(edge.to);
        }
    }
    return reachable;
}
function collectAllOutboundReachable(roots, edges) {
    const reachable = new Set();
    const stack = [...roots];
    while (stack.length > 0) {
        const id = stack.pop();
        if (reachable.has(id)) {
            continue;
        }
        reachable.add(id);
        for (const edge of (0, workflow_edge_util_1.listOutgoingEdges)(edges, id)) {
            stack.push(edge.to);
        }
    }
    return reachable;
}
function applyDetectCluesRouting(input) {
    var _a, _b, _c, _d;
    const now = (_a = input.now) !== null && _a !== void 0 ? _a : new Date().toISOString();
    let next = cloneRun(input.run);
    const matchedKeys = new Set(input.output.matchedClueKeys);
    const clueEdges = (0, workflow_edge_util_1.listClueEdgesFrom)(input.edges, input.fromNodeId);
    const defaultEdge = (0, workflow_edge_util_1.findDefaultEdgeFrom)(input.edges, input.fromNodeId);
    const matchedTargets = [];
    const unmatchedRoots = [];
    const seenMatched = new Set();
    const seenUnmatched = new Set();
    for (const edge of clueEdges) {
        const key = (_b = edge.clue) === null || _b === void 0 ? void 0 : _b.key;
        if (!key) {
            continue;
        }
        if (matchedKeys.has(key)) {
            if (!seenMatched.has(edge.to)) {
                seenMatched.add(edge.to);
                matchedTargets.push(edge.to);
            }
            continue;
        }
        if (!seenUnmatched.has(edge.to)) {
            seenUnmatched.add(edge.to);
            unmatchedRoots.push(edge.to);
        }
    }
    const hasMatch = matchedTargets.length > 0;
    const enabledRoots = hasMatch
        ? matchedTargets
        : defaultEdge
            ? [defaultEdge.to]
            : [];
    const outerSiblingRoots = ((_d = (_c = next.routing) === null || _c === void 0 ? void 0 : _c.pendingNodeIds) !== null && _d !== void 0 ? _d : []).filter((nodeId) => nodeId !== input.fromNodeId && !enabledRoots.includes(nodeId));
    const protectedIds = collectAlwaysReachable([...enabledRoots, ...outerSiblingRoots], input.edges);
    const skipRoots = [...unmatchedRoots];
    if (hasMatch && defaultEdge) {
        skipRoots.push(defaultEdge.to);
    }
    const skipCandidates = collectAllOutboundReachable(skipRoots, input.edges);
    for (const nodeId of skipCandidates) {
        if (protectedIds.has(nodeId)) {
            continue;
        }
        next = skipPendingNode(next, nodeId, now);
    }
    const siblingPending = outerSiblingRoots.filter((nodeId) => next.nodes.some((row) => row.nodeId === nodeId && row.status === 'pending'));
    next.routing =
        enabledRoots.length > 0 || siblingPending.length > 0
            ? { pendingNodeIds: [...enabledRoots, ...siblingPending] }
            : undefined;
    return next;
}
exports.applyDetectCluesRouting = applyDetectCluesRouting;
function advanceWorkflowRunAlongEdges(input) {
    var _a, _b;
    const run = input.run;
    if (run.status === 'failed' || run.status === 'cancelled') {
        return run;
    }
    const next = cloneRun(run);
    const currentId = next.currentNodeId;
    if (currentId != null) {
        const current = next.nodes.find((row) => row.nodeId === currentId);
        if (current &&
            current.status !== 'succeeded' &&
            current.status !== 'skipped') {
            throw new Error(`cannot advance: current node ${currentId} is ${current.status}`);
        }
        const alwaysEdges = (0, workflow_edge_util_1.listAlwaysEdgesFrom)(input.edges, currentId);
        for (const edge of alwaysEdges) {
            const target = next.nodes.find((row) => row.nodeId === edge.to);
            if ((target === null || target === void 0 ? void 0 : target.status) === 'pending') {
                next.currentNodeId = edge.to;
                return next;
            }
        }
    }
    const pending = (_b = (_a = next.routing) === null || _a === void 0 ? void 0 : _a.pendingNodeIds) !== null && _b !== void 0 ? _b : [];
    if (pending.length > 0) {
        const [upcoming, ...rest] = pending;
        next.currentNodeId = upcoming !== null && upcoming !== void 0 ? upcoming : null;
        next.routing =
            rest.length > 0 ? { pendingNodeIds: rest } : undefined;
        return next;
    }
    next.currentNodeId = null;
    return next;
}
exports.advanceWorkflowRunAlongEdges = advanceWorkflowRunAlongEdges;
function resolveEntryNodeId(input) {
    var _a, _b;
    if (input.entryNodeId &&
        input.nodes.some((node) => node.id === input.entryNodeId)) {
        return input.entryNodeId;
    }
    return (_b = (_a = input.nodes[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
}
exports.resolveEntryNodeId = resolveEntryNodeId;
//# sourceMappingURL=workflow-run-advance.util.js.map