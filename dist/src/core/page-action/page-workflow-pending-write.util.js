"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readWriteDataToolId = exports.readComposeMutationToolId = exports.resolvePageWorkflowPendingWrite = exports.resolvePageWorkflowPresentSummary = exports.buildPageComposeNodeOutput = void 0;
const COMPOSE_OUTPUT_KEY = 'page_compose_mutation';
function buildPageComposeNodeOutput(output) {
    return { [COMPOSE_OUTPUT_KEY]: output };
}
exports.buildPageComposeNodeOutput = buildPageComposeNodeOutput;
function resolvePageWorkflowPresentSummary(input) {
    for (const node of input.nodes) {
        if (node.action !== 'present_mutation') {
            continue;
        }
        const byRef = input.nodeOutputs[`obs:present_mutation:${node.id}`];
        const byId = input.nodeOutputs[node.id];
        for (const raw of [byRef, byId]) {
            if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
                continue;
            }
            const text = raw.summaryText;
            if (typeof text === 'string' && text.trim()) {
                return text.trim();
            }
        }
    }
    const fill = input.fillText.trim();
    return fill.length > 0 ? fill : null;
}
exports.resolvePageWorkflowPresentSummary = resolvePageWorkflowPresentSummary;
function resolvePageWorkflowPendingWrite(input) {
    var _a, _b, _c;
    for (const node of input.nodes) {
        if (node.action !== 'compose_mutation') {
            continue;
        }
        const raw = input.nodeOutputs[node.id];
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            continue;
        }
        const composed = raw[COMPOSE_OUTPUT_KEY];
        if (!composed || typeof composed !== 'object' || Array.isArray(composed)) {
            continue;
        }
        const row = composed;
        const tool = (_a = row.tool) === null || _a === void 0 ? void 0 : _a.trim();
        if (!tool) {
            continue;
        }
        const args = row.arguments;
        if (!args || typeof args !== 'object' || Array.isArray(args)) {
            continue;
        }
        return {
            tool,
            toolId: row.toolId,
            arguments: args,
            riskLevel: (_b = row.riskLevel) !== null && _b !== void 0 ? _b : 'L2',
        };
    }
    const writeNode = input.nodes.find((row) => row.action === 'write_data');
    const writeInput = writeNode === null || writeNode === void 0 ? void 0 : writeNode.input;
    const toolId = writeInput === null || writeInput === void 0 ? void 0 : writeInput.toolId;
    if (writeNode && typeof toolId === 'number' && toolId > 0) {
        for (const output of Object.values(input.nodeOutputs)) {
            if (!output || typeof output !== 'object' || Array.isArray(output)) {
                continue;
            }
            const candidate = output;
            const toolName = typeof candidate.toolName === 'string' ? candidate.toolName.trim() : '';
            const args = (_c = candidate.arguments) !== null && _c !== void 0 ? _c : candidate.args;
            if (toolName && args && typeof args === 'object' && !Array.isArray(args)) {
                return {
                    tool: toolName,
                    toolId,
                    arguments: args,
                    riskLevel: 'L2',
                };
            }
        }
    }
    return null;
}
exports.resolvePageWorkflowPendingWrite = resolvePageWorkflowPendingWrite;
function readComposeMutationToolId(input) {
    const toolId = input === null || input === void 0 ? void 0 : input.toolId;
    return typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0
        ? toolId
        : null;
}
exports.readComposeMutationToolId = readComposeMutationToolId;
function readWriteDataToolId(input) {
    const toolId = input === null || input === void 0 ? void 0 : input.toolId;
    return typeof toolId === 'number' && Number.isInteger(toolId) && toolId > 0
        ? toolId
        : null;
}
exports.readWriteDataToolId = readWriteDataToolId;
//# sourceMappingURL=page-workflow-pending-write.util.js.map