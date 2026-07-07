"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatWorkflowRunPendingSummary = exports.resolveActiveTaskStatusFromWorkflow = exports.buildStepProgressFromWorkflowRun = void 0;
function mapWorkflowNodeStatus(status) {
    switch (status) {
        case 'pending':
            return 'pending';
        case 'running':
            return 'running';
        case 'succeeded':
            return 'done';
        case 'failed':
            return 'failed';
        case 'skipped':
            return 'skipped';
        default:
            return 'pending';
    }
}
function workflowActionToKind(action) {
    switch (action) {
        case 'fetch_data':
        case 'compose_mutation':
        case 'write_data':
            return 'tool';
        case 'generate_and_push':
            return 'host_tool';
        case 'summarize':
        case 'present_mutation':
            return 'summarize';
        case 'load_page_context':
            return 'context';
        case 'await_user_confirm':
            return 'confirm';
        default:
            return action;
    }
}
function workflowActionToPhase(action) {
    switch (action) {
        case 'load_page_context':
        case 'fetch_data':
            return 'gather';
        case 'compose_mutation':
            return 'analyze';
        case 'write_data':
        case 'await_user_confirm':
            return 'mutate';
        default:
            return 'answer';
    }
}
function findPlanStepForWorkflowNode(plan, nodeId) {
    var _a;
    return ((_a = plan.steps.find((step) => step.id === nodeId)) !== null && _a !== void 0 ? _a : plan.steps.find((step) => step.id.startsWith(`${nodeId}:`)));
}
function buildStepProgressFromWorkflowRun(input) {
    return input.workflowRun.nodes.map((node) => {
        var _a, _b, _c;
        const planStep = findPlanStepForWorkflowNode(input.plan, node.nodeId);
        return Object.assign(Object.assign({ stepId: node.nodeId, phase: (_a = planStep === null || planStep === void 0 ? void 0 : planStep.phase) !== null && _a !== void 0 ? _a : workflowActionToPhase(node.action), kind: (_b = planStep === null || planStep === void 0 ? void 0 : planStep.kind) !== null && _b !== void 0 ? _b : workflowActionToKind(node.action), status: mapWorkflowNodeStatus(node.status) }, (node.outputRef ? { artifactRef: node.outputRef } : {})), (((_c = node.error) === null || _c === void 0 ? void 0 : _c.message) ? { summary: node.error.message } : {}));
    });
}
exports.buildStepProgressFromWorkflowRun = buildStepProgressFromWorkflowRun;
function resolveActiveTaskStatusFromWorkflow(input) {
    if (input.awaitingWriteConfirmation) {
        return 'awaiting_confirmation';
    }
    if (input.runStatus === 'failed' || input.workflowRun.status === 'failed') {
        return 'failed';
    }
    if (input.workflowRun.status === 'completed') {
        return 'completed';
    }
    const current = input.workflowRun.currentNodeId;
    if (current) {
        const node = input.workflowRun.nodes.find((row) => row.nodeId === current);
        if ((node === null || node === void 0 ? void 0 : node.action) === 'await_user_confirm' && node.status === 'running') {
            return 'awaiting_confirmation';
        }
    }
    return 'in_progress';
}
exports.resolveActiveTaskStatusFromWorkflow = resolveActiveTaskStatusFromWorkflow;
function formatWorkflowRunPendingSummary(workflowRun) {
    const pending = workflowRun.nodes
        .filter((row) => row.status === 'pending' || row.status === 'running')
        .map((row) => `${row.nodeId}(${row.action}/${row.status})`);
    const current = workflowRun.currentNodeId
        ? `current=${workflowRun.currentNodeId}`
        : 'current=none';
    return `workflowStatus=${workflowRun.status}; ${current}; pending=${pending.join(', ') || 'none'}`;
}
exports.formatWorkflowRunPendingSummary = formatWorkflowRunPendingSummary;
//# sourceMappingURL=workflow-goa-projection.util.js.map