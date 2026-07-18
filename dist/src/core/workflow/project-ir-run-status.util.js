"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCurrentIrNodeId = exports.projectIrRunNodeStatuses = void 0;
function aggregateExpandStepStatuses(statuses) {
    if (statuses.length === 0) {
        return 'pending';
    }
    if (statuses.some((s) => s === 'failed')) {
        return 'failed';
    }
    if (statuses.some((s) => s === 'running')) {
        return 'running';
    }
    if (statuses.every((s) => s === 'skipped')) {
        return 'skipped';
    }
    if (statuses.every((s) => s === 'succeeded' || s === 'skipped')) {
        return 'succeeded';
    }
    if (statuses.some((s) => s === 'succeeded' || s === 'skipped')) {
        return 'running';
    }
    return 'pending';
}
function groupKey(node) {
    var _a;
    return (_a = node.irNodeId) !== null && _a !== void 0 ? _a : node.nodeId;
}
function projectIrRunNodeStatuses(run) {
    const order = [];
    const groups = new Map();
    for (const node of run.nodes) {
        const key = groupKey(node);
        let group = groups.get(key);
        if (!group) {
            group = {
                irType: node.irType,
                stepNodeIds: [],
                statuses: [],
            };
            groups.set(key, group);
            order.push(key);
        }
        group.stepNodeIds.push(node.nodeId);
        group.statuses.push(node.status);
        if (!group.irType && node.irType) {
            group.irType = node.irType;
        }
    }
    const currentId = run.currentNodeId;
    return order.map((irNodeId) => {
        const group = groups.get(irNodeId);
        return {
            irNodeId,
            irType: group.irType,
            stepNodeIds: group.stepNodeIds,
            status: aggregateExpandStepStatuses(group.statuses),
            current: currentId != null && group.stepNodeIds.includes(currentId),
        };
    });
}
exports.projectIrRunNodeStatuses = projectIrRunNodeStatuses;
function resolveCurrentIrNodeId(run) {
    var _a;
    const currentId = run.currentNodeId;
    if (currentId == null) {
        return null;
    }
    const node = run.nodes.find((row) => row.nodeId === currentId);
    return (_a = node === null || node === void 0 ? void 0 : node.irNodeId) !== null && _a !== void 0 ? _a : currentId;
}
exports.resolveCurrentIrNodeId = resolveCurrentIrNodeId;
//# sourceMappingURL=project-ir-run-status.util.js.map