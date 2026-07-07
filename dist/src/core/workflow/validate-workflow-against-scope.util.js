"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkflowCompatibleWithScope = exports.validateWorkflowAgainstScope = void 0;
function pushIssue(issues, path, code, message) {
    issues.push({ path, code, message });
}
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function validateNodeAgainstScope(node, scope, issues) {
    var _a;
    const rawInput = node.input;
    if (!isRecord(rawInput)) {
        return;
    }
    const input = rawInput;
    const toolIds = new Set(scope.allowedToolIds);
    const hostToolIds = new Set(scope.allowedHostToolIds);
    const definitionKeys = new Set((_a = scope.allowedDefinitionKeys) !== null && _a !== void 0 ? _a : []);
    switch (node.action) {
        case 'fetch_data': {
            const toolId = input.toolId;
            const definitionKey = input.definitionKey;
            if (isPositiveInt(toolId) && !toolIds.has(toolId)) {
                pushIssue(issues, `nodes.${node.id}.input.toolId`, 'tool_out_of_scope', `toolId ${toolId} is not in current run scope`);
            }
            if (typeof definitionKey === 'string' &&
                definitionKey.trim() &&
                definitionKeys.size > 0 &&
                !definitionKeys.has(definitionKey.trim())) {
                pushIssue(issues, `nodes.${node.id}.input.definitionKey`, 'tool_out_of_scope', `definitionKey ${definitionKey} is not in current run scope`);
            }
            break;
        }
        case 'generate_and_push': {
            const hostToolId = input.hostToolId;
            if (isPositiveInt(hostToolId) && !hostToolIds.has(hostToolId)) {
                pushIssue(issues, `nodes.${node.id}.input.hostToolId`, 'host_tool_out_of_scope', `hostToolId ${hostToolId} is not in current run scope`);
            }
            break;
        }
        case 'compose_mutation':
        case 'write_data': {
            const toolId = input.toolId;
            if (isPositiveInt(toolId) && !toolIds.has(toolId)) {
                pushIssue(issues, `nodes.${node.id}.input.toolId`, 'tool_out_of_scope', `toolId ${toolId} is not in current run scope`);
            }
            break;
        }
        default:
            break;
    }
}
function validateWorkflowAgainstScope(input) {
    const issues = [];
    for (const node of input.nodes) {
        validateNodeAgainstScope(node, input.scope, issues);
    }
    return issues;
}
exports.validateWorkflowAgainstScope = validateWorkflowAgainstScope;
function isWorkflowCompatibleWithScope(input) {
    return validateWorkflowAgainstScope(input).length === 0;
}
exports.isWorkflowCompatibleWithScope = isWorkflowCompatibleWithScope;
//# sourceMappingURL=validate-workflow-against-scope.util.js.map