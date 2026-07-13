"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkflowBindingsForSave = exports.deriveWorkflowBindingsFromNodes = exports.collectWorkflowNodeBindingRefs = void 0;
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function isPositiveInt(value) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
function collectWorkflowNodeBindingRefs(nodes) {
    const toolIds = new Set();
    const hostToolIds = new Set();
    for (const node of nodes) {
        const rawInput = node.input;
        if (!isRecord(rawInput)) {
            continue;
        }
        const input = rawInput;
        switch (node.action) {
            case 'fetch_data':
            case 'compose_mutation':
            case 'write_data': {
                const toolId = input.toolId;
                if (isPositiveInt(toolId)) {
                    toolIds.add(toolId);
                }
                break;
            }
            case 'generate_and_push': {
                const hostToolId = input.hostToolId;
                if (isPositiveInt(hostToolId)) {
                    hostToolIds.add(hostToolId);
                }
                break;
            }
            default:
                break;
        }
    }
    return {
        toolIds: [...toolIds],
        hostToolIds: [...hostToolIds],
    };
}
exports.collectWorkflowNodeBindingRefs = collectWorkflowNodeBindingRefs;
function deriveWorkflowBindingsFromNodes(nodes) {
    const refs = collectWorkflowNodeBindingRefs(nodes);
    return {
        tools: refs.toolIds.map((toolId) => ({ toolId, isRequired: false })),
        hostTools: refs.hostToolIds.map((hostToolId) => ({
            hostToolId,
            isRequired: false,
        })),
    };
}
exports.deriveWorkflowBindingsFromNodes = deriveWorkflowBindingsFromNodes;
function resolveWorkflowBindingsForSave(input) {
    var _a, _b, _c, _d;
    const derived = deriveWorkflowBindingsFromNodes(input.nodes);
    const issues = [];
    const nodeToolIds = new Set(derived.tools.map((row) => row.toolId));
    const nodeHostToolIds = new Set(derived.hostTools.map((row) => row.hostToolId));
    const requiredByToolId = new Map();
    for (const row of (_a = input.explicitTools) !== null && _a !== void 0 ? _a : []) {
        if (!nodeToolIds.has(row.toolId)) {
            issues.push({
                path: 'tools',
                code: 'orphan_tool_binding',
                message: `tools[].toolId=${row.toolId} is not referenced by any workflow node input.toolId`,
            });
            continue;
        }
        requiredByToolId.set(row.toolId, (_b = row.isRequired) !== null && _b !== void 0 ? _b : false);
    }
    const requiredByHostToolId = new Map();
    for (const row of (_c = input.explicitHostTools) !== null && _c !== void 0 ? _c : []) {
        if (!nodeHostToolIds.has(row.hostToolId)) {
            issues.push({
                path: 'hostTools',
                code: 'orphan_host_tool_binding',
                message: `hostTools[].hostToolId=${row.hostToolId} is not referenced by any workflow node input.hostToolId`,
            });
            continue;
        }
        requiredByHostToolId.set(row.hostToolId, (_d = row.isRequired) !== null && _d !== void 0 ? _d : false);
    }
    return {
        tools: derived.tools.map((row) => {
            var _a;
            return ({
                toolId: row.toolId,
                isRequired: (_a = requiredByToolId.get(row.toolId)) !== null && _a !== void 0 ? _a : false,
            });
        }),
        hostTools: derived.hostTools.map((row) => {
            var _a;
            return ({
                hostToolId: row.hostToolId,
                isRequired: (_a = requiredByHostToolId.get(row.hostToolId)) !== null && _a !== void 0 ? _a : false,
            });
        }),
        issues,
    };
}
exports.resolveWorkflowBindingsForSave = resolveWorkflowBindingsForSave;
//# sourceMappingURL=derive-workflow-bindings-from-nodes.util.js.map