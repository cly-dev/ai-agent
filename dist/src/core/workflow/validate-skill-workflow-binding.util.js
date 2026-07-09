"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSkillWorkflowBinding = exports.validateSkillWorkflowBinding = void 0;
const derive_workflow_bindings_from_nodes_util_1 = require("./derive-workflow-bindings-from-nodes.util");
function pushIssue(issues, path, code, message) {
    issues.push({ path, code, message });
}
function validateSkillWorkflowBinding(input) {
    const issues = [];
    const skillTools = new Set(input.skillToolIds);
    const skillHosts = new Set(input.skillHostToolIds);
    for (const toolId of input.workflowToolIds) {
        if (!skillTools.has(toolId)) {
            pushIssue(issues, 'skillTools', 'workflow_tool_not_in_skill', `WorkflowTool toolId=${toolId} must be bound on Skill (SkillTool)`);
        }
    }
    for (const hostToolId of input.workflowHostToolIds) {
        if (!skillHosts.has(hostToolId)) {
            pushIssue(issues, 'skillHostTools', 'workflow_host_tool_not_in_skill', `WorkflowHostTool hostToolId=${hostToolId} must be bound on Skill (SkillHostTool)`);
        }
    }
    const nodeRefs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(input.nodes);
    for (const toolId of nodeRefs.toolIds) {
        if (!skillTools.has(toolId)) {
            pushIssue(issues, 'nodes.input.toolId', 'node_tool_not_in_skill', `Workflow node references toolId=${toolId} which is not in SkillTool bindings`);
        }
    }
    for (const hostToolId of nodeRefs.hostToolIds) {
        if (!skillHosts.has(hostToolId)) {
            pushIssue(issues, 'nodes.input.hostToolId', 'node_host_tool_not_in_skill', `Workflow node references hostToolId=${hostToolId} which is not in SkillHostTool bindings`);
        }
    }
    return issues;
}
exports.validateSkillWorkflowBinding = validateSkillWorkflowBinding;
function isValidSkillWorkflowBinding(input) {
    return validateSkillWorkflowBinding(input).length === 0;
}
exports.isValidSkillWorkflowBinding = isValidSkillWorkflowBinding;
//# sourceMappingURL=validate-skill-workflow-binding.util.js.map