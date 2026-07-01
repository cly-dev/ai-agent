"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidWorkflowDefinition = exports.validateWorkflowDefinition = void 0;
const workflow_action_registry_1 = require("./workflow-action-registry");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function pushIssue(issues, path, code, message) {
    issues.push({ path, code, message });
}
function validateNodeInput(node, issues) {
    const basePath = `nodes.${node.id}.input`;
    const rawInput = node.input;
    if (!isRecord(rawInput)) {
        pushIssue(issues, basePath, 'invalid_input', 'input must be an object');
        return;
    }
    const input = rawInput;
    switch (node.action) {
        case 'load_page_context':
            if (input.materialize != null &&
                typeof input.materialize !== 'boolean') {
                pushIssue(issues, `${basePath}.materialize`, 'invalid_boolean', 'materialize must be boolean');
            }
            break;
        case 'fetch_data': {
            if (!isPositiveInt(input.toolId)) {
                pushIssue(issues, `${basePath}.toolId`, 'missing_tool_id', 'fetch_data requires input.toolId (bind HTTP Tool by numeric id on the node)');
            }
            if (input.completeWhen != null &&
                input.completeWhen !== 'first_success' &&
                input.completeWhen !== 'fetch_all_pages') {
                pushIssue(issues, `${basePath}.completeWhen`, 'invalid_enum', 'completeWhen must be first_success or fetch_all_pages');
            }
            break;
        }
        case 'generate_and_push':
            if (!isPositiveInt(input.hostToolId)) {
                pushIssue(issues, `${basePath}.hostToolId`, 'missing_host_tool', 'generate_and_push requires hostToolId');
            }
            if (input.stream != null && typeof input.stream !== 'boolean') {
                pushIssue(issues, `${basePath}.stream`, 'invalid_boolean', 'stream must be boolean');
            }
            break;
        case 'summarize':
            if (input.mode != null &&
                input.mode !== 'brief' &&
                input.mode !== 'detailed' &&
                input.mode !== 'draft' &&
                input.mode !== 'final') {
                pushIssue(issues, `${basePath}.mode`, 'invalid_enum', 'mode must be brief, detailed, draft, or final');
            }
            break;
        case 'compose_mutation':
        case 'write_data':
            if (!isPositiveInt(input.toolId)) {
                pushIssue(issues, `${basePath}.toolId`, 'missing_tool', `${node.action} requires toolId`);
            }
            break;
        case 'present_mutation':
            if (input.mode != null &&
                input.mode !== 'brief' &&
                input.mode !== 'detailed') {
                pushIssue(issues, `${basePath}.mode`, 'invalid_enum', 'mode must be brief or detailed');
            }
            break;
        case 'await_user_confirm':
            if (input.confirmKind != null &&
                input.confirmKind !== 'mutation' &&
                input.confirmKind !== 'generic') {
                pushIssue(issues, `${basePath}.confirmKind`, 'invalid_enum', 'confirmKind must be mutation or generic');
            }
            break;
        default:
            pushIssue(issues, `nodes.${node.id}.action`, 'unknown_action', `unknown action ${String(node.action)}`);
    }
}
function validateNodeBindings(node, bindings, issues) {
    const rawInput = node.input;
    if (!isRecord(rawInput)) {
        return;
    }
    const input = rawInput;
    if ((node.action === 'fetch_data' ||
        node.action === 'compose_mutation' ||
        node.action === 'write_data') &&
        isPositiveInt(input.toolId) &&
        !bindings.toolIds.includes(input.toolId)) {
        pushIssue(issues, `nodes.${node.id}.input.toolId`, 'tool_not_bound', `toolId ${input.toolId} is not in WorkflowTool bindings`);
    }
    if (node.action === 'generate_and_push' &&
        isPositiveInt(input.hostToolId) &&
        !bindings.hostToolIds.includes(input.hostToolId)) {
        pushIssue(issues, `nodes.${node.id}.input.hostToolId`, 'host_tool_not_bound', `hostToolId ${input.hostToolId} is not in WorkflowHostTool bindings`);
    }
}
function validateNodeDef(node, index, profile, bindings, issues) {
    const path = `nodes[${index}]`;
    if (!isRecord(node)) {
        pushIssue(issues, path, 'invalid_node', 'node must be an object');
        return null;
    }
    const id = node.id;
    const action = node.action;
    const name = node.name;
    const objective = node.objective;
    if (!isNonEmptyString(id)) {
        pushIssue(issues, `${path}.id`, 'missing_id', 'node id is required');
    }
    if (!isNonEmptyString(name)) {
        pushIssue(issues, `${path}.name`, 'missing_name', 'node name is required');
    }
    if (!isNonEmptyString(objective)) {
        pushIssue(issues, `${path}.objective`, 'missing_objective', 'node objective is required');
    }
    if (!isNonEmptyString(action) || !(0, workflow_action_registry_1.isWorkflowActionKind)(action)) {
        pushIssue(issues, `${path}.action`, 'unknown_action', 'action is not in workflow registry');
        return null;
    }
    const registryEntry = (0, workflow_action_registry_1.getWorkflowActionRegistryEntry)(action);
    if (!(registryEntry === null || registryEntry === void 0 ? void 0 : registryEntry.implemented)) {
        pushIssue(issues, `${path}.action`, 'action_not_implemented', `action ${action} is not implemented yet`);
    }
    if (!(0, workflow_action_registry_1.workflowProfileAllowsAction)(profile, action)) {
        pushIssue(issues, `${path}.action`, 'action_not_allowed_for_profile', `action ${action} is not allowed for profile ${profile}`);
    }
    const typedNode = node;
    validateNodeInput(typedNode, issues);
    validateNodeBindings(typedNode, bindings, issues);
    return typedNode;
}
function validateWorkflowDefinition(input) {
    var _a;
    const issues = [];
    const { definition } = input;
    const bindings = (_a = input.bindings) !== null && _a !== void 0 ? _a : { toolIds: [], hostToolIds: [] };
    if (!isNonEmptyString(definition.workflowKey)) {
        pushIssue(issues, 'workflowKey', 'missing_workflow_key', 'workflowKey is required');
    }
    if (!isNonEmptyString(definition.name)) {
        pushIssue(issues, 'name', 'missing_name', 'name is required');
    }
    if (definition.profile !== 'chat_skill' &&
        definition.profile !== 'page_action' &&
        definition.profile !== 'shared') {
        pushIssue(issues, 'profile', 'invalid_profile', 'profile must be chat_skill, page_action, or shared');
    }
    if (!Array.isArray(definition.nodes) || definition.nodes.length === 0) {
        pushIssue(issues, 'nodes', 'empty_nodes', 'nodes must be a non-empty array');
        return issues;
    }
    const seenIds = new Set();
    for (let index = 0; index < definition.nodes.length; index += 1) {
        const node = validateNodeDef(definition.nodes[index], index, definition.profile, bindings, issues);
        if (node && isNonEmptyString(node.id)) {
            if (seenIds.has(node.id)) {
                pushIssue(issues, `nodes.${node.id}.id`, 'duplicate_node_id', `duplicate node id ${node.id}`);
            }
            seenIds.add(node.id);
        }
    }
    return issues;
}
exports.validateWorkflowDefinition = validateWorkflowDefinition;
function isValidWorkflowDefinition(input) {
    return validateWorkflowDefinition(input).length === 0;
}
exports.isValidWorkflowDefinition = isValidWorkflowDefinition;
//# sourceMappingURL=validate-workflow.util.js.map