"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageGenerateAndPushExecutor = void 0;
const page_action_host_fill_executor_1 = require("../../../page-action/page-action-host-fill.executor");
const page_workflow_messages_util_1 = require("../../../page-action/page-workflow-messages.util");
const page_workflow_node_util_1 = require("../../../page-action/page-workflow-node.util");
const workflow_run_util_1 = require("../../workflow-run.util");
const workflow_node_output_util_1 = require("../../workflow-node-output.util");
const page_action_workflow_host_util_1 = require("../../../page-action/page-action-workflow-host.util");
const executor_host_util_1 = require("../executor-host.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
exports.pageGenerateAndPushExecutor = {
    action: 'generate_and_push',
    async run(ctx) {
        var _a;
        const { runtime } = (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        const nodeInput = (isRecord(ctx.def.input) ? ctx.def.input : {});
        const hostTool = await (0, page_action_workflow_host_util_1.resolvePageActionHostToolForPushNode)(runtime.prisma, {
            appClientId: runtime.appClientId,
            hostToolId: nodeInput.hostToolId,
            pageContext: runtime.pageContext,
            fallbackHostTool: runtime.hostTool,
        });
        const messages = (0, page_workflow_messages_util_1.injectWorkflowNodeObjective)((0, page_workflow_messages_util_1.appendWorkflowNodeOutputsToMessages)(runtime.messages, runtime.nodeOutputs), ctx.def.objective, runtime.objectivePrefix);
        const fillResult = await (0, page_action_host_fill_executor_1.executePageActionHostFill)(runtime.llmService, {
            actionRunId: runtime.actionRunId,
            actionKey: runtime.actionKey,
            generation: runtime.generation,
            clientActionId: (_a = runtime.clientActionId) !== null && _a !== void 0 ? _a : null,
            systemPrompt: runtime.systemPrompt,
            messages,
            pageContext: runtime.pageContext,
            hostTool,
            res: runtime.res,
            stepRecorder: runtime.stepRecorder,
        });
        runtime.fillText = fillResult.fillText;
        runtime.dslOutcome = fillResult.dslOutcome;
        (0, page_workflow_node_util_1.mergePageWorkflowLlmMetrics)(runtime.metrics, fillResult);
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        const nodeOutput = {
            fillText: fillResult.fillText,
            dslOutcome: fillResult.dslOutcome,
        };
        return {
            kind: 'completed',
            workflowRun: (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef),
            outputRef,
            nodeOutput,
        };
    },
};
//# sourceMappingURL=page-generate-and-push.executor.js.map