"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectWorkflowScopedToolIds = exports.workflowNodeRefsRunnableForUser = exports.resolveWorkflowPushHostToolId = void 0;
const derive_workflow_bindings_from_nodes_util_1 = require("./derive-workflow-bindings-from-nodes.util");
function resolveWorkflowPushHostToolId(nodes, preferredHostToolId) {
    var _a;
    const refs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(nodes);
    if (refs.hostToolIds.length === 0) {
        return null;
    }
    if (preferredHostToolId != null &&
        preferredHostToolId > 0 &&
        refs.hostToolIds.includes(preferredHostToolId)) {
        return preferredHostToolId;
    }
    return (_a = refs.hostToolIds[0]) !== null && _a !== void 0 ? _a : null;
}
exports.resolveWorkflowPushHostToolId = resolveWorkflowPushHostToolId;
function workflowNodeRefsRunnableForUser(input) {
    const refs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(input.nodes);
    for (const toolId of refs.toolIds) {
        if (!input.userAllowedToolIds.has(toolId)) {
            return false;
        }
    }
    for (const hostToolId of refs.hostToolIds) {
        if (!input.userAllowedHostToolIds.has(hostToolId)) {
            return false;
        }
    }
    return true;
}
exports.workflowNodeRefsRunnableForUser = workflowNodeRefsRunnableForUser;
function collectWorkflowScopedToolIds(nodes, userAllowedToolIds) {
    const refs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(nodes);
    return refs.toolIds.filter((toolId) => userAllowedToolIds.has(toolId));
}
exports.collectWorkflowScopedToolIds = collectWorkflowScopedToolIds;
//# sourceMappingURL=workflow-runtime-scope.util.js.map