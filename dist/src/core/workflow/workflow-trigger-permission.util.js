"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateWorkflowTriggerPermissionForNodes = exports.evaluateWorkflowTriggerPermission = exports.extractWorkflowWriteToolIds = exports.isWorkflowTriggerPermissionEnabled = void 0;
const resolve_workflow_node_runtime_input_util_1 = require("./resolve-workflow-node-runtime-input.util");
const WORKFLOW_TRIGGER_PERMISSION_ENV = 'WORKFLOW_TRIGGER_PERMISSION';
function isWorkflowTriggerPermissionEnabled(env = process.env) {
    return env[WORKFLOW_TRIGGER_PERMISSION_ENV] !== 'false';
}
exports.isWorkflowTriggerPermissionEnabled = isWorkflowTriggerPermissionEnabled;
function extractWorkflowWriteToolIds(nodes) {
    const ids = new Set();
    for (const node of nodes) {
        if (node.action !== 'write_data') {
            continue;
        }
        const input = (0, resolve_workflow_node_runtime_input_util_1.resolveWorkflowNodeRuntimeInput)(node);
        const toolId = input === null || input === void 0 ? void 0 : input.toolId;
        if (typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0) {
            ids.add(toolId);
        }
    }
    return [...ids];
}
exports.extractWorkflowWriteToolIds = extractWorkflowWriteToolIds;
function evaluateWorkflowTriggerPermission(input) {
    var _a;
    const enabled = (_a = input.enabled) !== null && _a !== void 0 ? _a : true;
    if (!enabled) {
        return { allowed: true, missingToolIds: [], skipped: true };
    }
    const allowed = new Set(input.allowedToolIds);
    const missingToolIds = input.writeToolIds.filter((id) => !allowed.has(id));
    return {
        allowed: missingToolIds.length === 0,
        missingToolIds,
        skipped: false,
    };
}
exports.evaluateWorkflowTriggerPermission = evaluateWorkflowTriggerPermission;
function evaluateWorkflowTriggerPermissionForNodes(input) {
    return evaluateWorkflowTriggerPermission({
        writeToolIds: extractWorkflowWriteToolIds(input.nodes),
        allowedToolIds: input.allowedToolIds,
        enabled: input.enabled,
    });
}
exports.evaluateWorkflowTriggerPermissionForNodes = evaluateWorkflowTriggerPermissionForNodes;
//# sourceMappingURL=workflow-trigger-permission.util.js.map