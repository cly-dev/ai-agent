"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePageActionWorkflowBinding = void 0;
const derive_workflow_bindings_from_nodes_util_1 = require("./derive-workflow-bindings-from-nodes.util");
function pushIssue(issues, path, code, message) {
    issues.push({ path, code, message });
}
function validatePageActionWorkflowBinding(input) {
    const issues = [];
    const refs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(input.nodes);
    if (refs.hostToolIds.length === 0) {
        pushIssue(issues, 'nodes', 'missing_generate_and_push', 'Workflow bound to PageAction must include at least one generate_and_push node with input.hostToolId');
        return issues;
    }
    if (!refs.hostToolIds.includes(input.pageActionHostToolId)) {
        pushIssue(issues, 'hostToolId', 'page_action_host_tool_not_in_workflow_nodes', `PageAction.hostToolId=${input.pageActionHostToolId} must match a generate_and_push node input.hostToolId in Workflow (found: ${refs.hostToolIds.join(', ')})`);
    }
    return issues;
}
exports.validatePageActionWorkflowBinding = validatePageActionWorkflowBinding;
//# sourceMappingURL=validate-page-action-workflow-binding.util.js.map