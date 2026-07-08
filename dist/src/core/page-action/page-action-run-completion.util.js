"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePageWorkflowCompletion = exports.completionFromSummarizeText = exports.completionFromHostFill = void 0;
const TEXT_TERMINAL_ACTIONS = new Set([
    'summarize',
    'generate_and_push',
]);
function completionFromHostFill(input) {
    const fillText = input.fillText.trim();
    if (!fillText) {
        return {
            kind: 'failed',
            errorCode: 'STREAM_EMPTY',
            errorMessage: 'LLM produced empty fill text',
        };
    }
    return { kind: 'text', fillText, dslOutcome: input.dslOutcome };
}
exports.completionFromHostFill = completionFromHostFill;
function completionFromSummarizeText(summaryText) {
    const fillText = summaryText.trim();
    if (!fillText) {
        return {
            kind: 'failed',
            errorCode: 'STREAM_EMPTY',
            errorMessage: 'LLM produced empty summary text',
        };
    }
    return { kind: 'text', fillText, dslOutcome: null };
}
exports.completionFromSummarizeText = completionFromSummarizeText;
function readToolNameFromNodeOutput(nodeOutputs, nodeId) {
    const raw = nodeOutputs === null || nodeOutputs === void 0 ? void 0 : nodeOutputs[nodeId];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null;
    }
    const row = raw;
    if (typeof row.toolName === 'string' && row.toolName.trim()) {
        return row.toolName.trim();
    }
    if (typeof row.tool === 'string' && row.tool.trim()) {
        return row.tool.trim();
    }
    return null;
}
function getWorkflowRunNode(workflowRun, nodeId) {
    return workflowRun.nodes.find((row) => row.nodeId === nodeId);
}
function failedWorkflowCompletion(workflowRun) {
    var _a, _b, _c, _d;
    const failedNode = workflowRun.nodes.find((row) => row.status === 'failed');
    return {
        kind: 'failed',
        errorCode: (_b = (_a = failedNode === null || failedNode === void 0 ? void 0 : failedNode.error) === null || _a === void 0 ? void 0 : _a.code) !== null && _b !== void 0 ? _b : 'WORKFLOW_FAILED',
        errorMessage: (_d = (_c = failedNode === null || failedNode === void 0 ? void 0 : failedNode.error) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : 'Workflow run failed',
    };
}
function resolveHttpTerminalCompletion(input) {
    if (input.workflowRun.status !== 'completed') {
        return null;
    }
    const lastDef = input.workflowNodes[input.workflowNodes.length - 1];
    if (!lastDef) {
        return null;
    }
    const lastRun = getWorkflowRunNode(input.workflowRun, lastDef.id);
    if (lastDef.action === 'write_data' && (lastRun === null || lastRun === void 0 ? void 0 : lastRun.status) === 'succeeded') {
        return {
            kind: 'http_write',
            nodeId: lastDef.id,
            toolName: readToolNameFromNodeOutput(input.nodeOutputs, lastDef.id),
        };
    }
    if (lastDef.action === 'fetch_data' && (lastRun === null || lastRun === void 0 ? void 0 : lastRun.status) === 'succeeded') {
        return {
            kind: 'http_read',
            nodeId: lastDef.id,
            toolName: readToolNameFromNodeOutput(input.nodeOutputs, lastDef.id),
        };
    }
    return null;
}
function resolvePageWorkflowCompletion(input) {
    var _a, _b;
    if (input.suspended && input.approvalRequestId != null) {
        return { kind: 'suspended', approvalRequestId: input.approvalRequestId };
    }
    if ((_a = input.errorCode) === null || _a === void 0 ? void 0 : _a.trim()) {
        return {
            kind: 'failed',
            errorCode: input.errorCode.trim(),
            errorMessage: ((_b = input.errorMessage) === null || _b === void 0 ? void 0 : _b.trim()) || input.errorCode.trim(),
        };
    }
    if (input.workflowRun.status === 'failed') {
        return failedWorkflowCompletion(input.workflowRun);
    }
    const httpTerminal = resolveHttpTerminalCompletion({
        workflowNodes: input.workflowNodes,
        workflowRun: input.workflowRun,
        nodeOutputs: input.runtime.nodeOutputs,
    });
    if (httpTerminal) {
        return httpTerminal;
    }
    const fillText = input.runtime.fillText.trim();
    if (fillText.length > 0) {
        return {
            kind: 'text',
            fillText,
            dslOutcome: input.runtime.dslOutcome,
        };
    }
    if (input.workflowRun.status !== 'completed') {
        return {
            kind: 'failed',
            errorCode: 'WORKFLOW_INCOMPLETE',
            errorMessage: 'Workflow did not complete successfully',
        };
    }
    const lastDef = input.workflowNodes[input.workflowNodes.length - 1];
    if (!lastDef) {
        return { kind: 'workflow_done' };
    }
    if (TEXT_TERMINAL_ACTIONS.has(lastDef.action)) {
        return {
            kind: 'failed',
            errorCode: 'STREAM_EMPTY',
            errorMessage: 'Expected text output but none was produced',
        };
    }
    return { kind: 'workflow_done' };
}
exports.resolvePageWorkflowCompletion = resolvePageWorkflowCompletion;
//# sourceMappingURL=page-action-run-completion.util.js.map