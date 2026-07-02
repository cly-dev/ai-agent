"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagePresentMutationExecutor = void 0;
const page_workflow_summarize_util_1 = require("../../../page-action/page-workflow-summarize.util");
const page_workflow_messages_util_1 = require("../../../page-action/page-workflow-messages.util");
const page_workflow_node_util_1 = require("../../../page-action/page-workflow-node.util");
const workflow_run_util_1 = require("../../workflow-run.util");
const workflow_node_output_util_1 = require("../../workflow-node-output.util");
const executor_host_util_1 = require("../executor-host.util");
exports.pagePresentMutationExecutor = {
    action: 'present_mutation',
    async run(ctx) {
        var _a, _b;
        const { runtime } = (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        const nodeInput = ctx.def.input;
        const mode = (_a = nodeInput.mode) !== null && _a !== void 0 ? _a : 'brief';
        const messages = (0, page_workflow_messages_util_1.injectWorkflowNodeObjective)((0, page_workflow_messages_util_1.appendWorkflowNodeOutputsToMessages)(runtime.messages, runtime.nodeOutputs), ctx.def.objective, runtime.objectivePrefix);
        const summarizeResult = await (0, page_workflow_summarize_util_1.executePageWorkflowSummarize)({
            llmService: runtime.llmService,
            messages,
            nodeInput: { mode },
            res: runtime.res,
            actionRunId: runtime.actionRunId,
            actionKey: runtime.actionKey,
            generation: runtime.generation,
            clientActionId: (_b = runtime.clientActionId) !== null && _b !== void 0 ? _b : null,
            existingFillText: runtime.fillText,
            stepRecorder: runtime.stepRecorder,
            streamLifecycle: 'none',
        });
        (0, page_workflow_node_util_1.mergePageWorkflowLlmMetrics)(runtime.metrics, summarizeResult);
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        const nodeOutput = {
            summaryText: summarizeResult.summaryText,
            mode,
        };
        return {
            kind: 'completed',
            workflowRun: (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef),
            outputRef,
            nodeOutput,
        };
    },
};
//# sourceMappingURL=page-present-mutation.executor.js.map