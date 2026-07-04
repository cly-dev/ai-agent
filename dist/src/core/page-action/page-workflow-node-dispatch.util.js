"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchPageWorkflowNodeOutcome = void 0;
function dispatchPageWorkflowNodeOutcome(input) {
    const { rawOutcome } = input;
    if (rawOutcome.kind === 'failed') {
        return {
            action: 'fail',
            workflowRun: rawOutcome.workflowRun,
            errorCode: rawOutcome.error.code,
            errorMessage: rawOutcome.error.message,
        };
    }
    if (rawOutcome.kind === 'awaiting_user_confirm') {
        return {
            action: 'suspend',
            workflowRun: rawOutcome.workflowRun,
            outcome: rawOutcome,
            nodeId: input.nodeId,
        };
    }
    if (rawOutcome.kind === 'delegate_react') {
        return {
            action: 'react',
            workflowRun: rawOutcome.workflowRun,
            outcome: rawOutcome,
        };
    }
    if (rawOutcome.kind === 'pending_summarize') {
        return {
            action: 'fail',
            workflowRun: rawOutcome.workflowRun,
            errorCode: 'pending_summarize_not_supported_on_page',
            errorMessage: 'present_mutation pending_summarize is not supported on page workflow; use summarize action',
        };
    }
    return {
        action: 'advance',
        workflowRun: rawOutcome.workflowRun,
        outcome: rawOutcome,
    };
}
exports.dispatchPageWorkflowNodeOutcome = dispatchPageWorkflowNodeOutcome;
//# sourceMappingURL=page-workflow-node-dispatch.util.js.map