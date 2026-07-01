"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageFetchDataExecutor = void 0;
const page_workflow_fetch_data_util_1 = require("../../../page-action/page-workflow-fetch-data.util");
const workflow_run_util_1 = require("../../workflow-run.util");
const workflow_node_output_util_1 = require("../../workflow-node-output.util");
const executor_host_util_1 = require("../executor-host.util");
exports.pageFetchDataExecutor = {
    action: 'fetch_data',
    async run(ctx) {
        const { runtime } = (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        const nodeInput = ctx.def.input;
        const observation = await (0, page_workflow_fetch_data_util_1.executePageWorkflowFetchData)({
            prisma: runtime.prisma,
            toolEngine: runtime.toolEngine,
            userId: runtime.userId,
            appClientId: runtime.appClientId,
            nodeInput,
            pageContext: runtime.pageContext,
        });
        runtime.stepRecorder.record({
            type: 'workflow',
            name: `${ctx.nodeId}:tool`,
            detail: {
                toolId: observation.toolId,
                toolName: observation.toolName,
                args: observation.args,
            },
        });
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        const nodeOutput = {
            toolId: observation.toolId,
            toolName: observation.toolName,
            output: observation.output,
            agentMetadata: observation.agentMetadata,
        };
        return {
            kind: 'completed',
            workflowRun: (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef),
            outputRef,
            nodeOutput,
        };
    },
};
//# sourceMappingURL=page-fetch-data.executor.js.map