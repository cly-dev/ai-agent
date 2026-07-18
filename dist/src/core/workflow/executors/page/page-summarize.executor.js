"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageSummarizeExecutor = void 0;
const common_1 = require("@nestjs/common");
const page_workflow_summarize_util_1 = require("../../../page-action/page-workflow-summarize.util");
const page_workflow_messages_util_1 = require("../../../page-action/page-workflow-messages.util");
const page_workflow_node_util_1 = require("../../../page-action/page-workflow-node.util");
const workflow_run_util_1 = require("../../workflow-run.util");
const workflow_node_output_util_1 = require("../../workflow-node-output.util");
const resolve_workflow_node_runtime_input_util_1 = require("../../resolve-workflow-node-runtime-input.util");
const executor_host_util_1 = require("../executor-host.util");
const logger = new common_1.Logger('PageSummarizeExecutor');
function warnDeprecatedSummarizeHostToolId(nodeId, hostToolId) {
    if (typeof hostToolId === 'number' &&
        Number.isInteger(hostToolId) &&
        hostToolId > 0) {
        logger.warn(`summarize node ${nodeId}: input.hostToolId=${hostToolId} is ignored; ` +
            'summarize uses page_action prose stream (phase=stream), not HostTool DSL');
    }
}
exports.pageSummarizeExecutor = {
    action: 'summarize',
    async run(ctx) {
        var _a, _b;
        const { runtime } = (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        const nodeInput = (0, resolve_workflow_node_runtime_input_util_1.resolveWorkflowNodeRuntimeInput)(ctx.def);
        warnDeprecatedSummarizeHostToolId(ctx.nodeId, nodeInput.hostToolId);
        const mode = (_a = nodeInput.mode) !== null && _a !== void 0 ? _a : 'final';
        const messages = (0, page_workflow_messages_util_1.injectWorkflowNodeObjective)((0, page_workflow_messages_util_1.appendWorkflowNodeOutputsToMessages)(runtime.messages, runtime.nodeOutputs), ctx.def.objective, runtime.objectivePrefix);
        const summarizeResult = await (0, page_workflow_summarize_util_1.executePageWorkflowSummarize)({
            llmService: runtime.llmService,
            messages,
            nodeInput,
            sseSink: runtime.sseSink,
            actionRunId: runtime.actionRunId,
            actionKey: runtime.actionKey,
            generation: runtime.generation,
            clientActionId: (_b = runtime.clientActionId) !== null && _b !== void 0 ? _b : null,
            existingFillText: runtime.fillText,
            pageContext: runtime.pageContext,
            stepRecorder: runtime.stepRecorder,
            streamIdSegment: ctx.nodeId,
            systemPrompt: runtime.systemPrompt,
            objectivePrefix: runtime.objectivePrefix,
            nodeObjective: ctx.def.objective,
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
//# sourceMappingURL=page-summarize.executor.js.map