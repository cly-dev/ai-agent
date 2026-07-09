"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPageContextExecutor = void 0;
const page_context_usage_util_1 = require("../../host-bridge/page-context-usage.util");
const workflow_run_util_1 = require("../workflow-run.util");
const workflow_node_output_util_1 = require("../workflow-node-output.util");
const executor_host_util_1 = require("./executor-host.util");
exports.loadPageContextExecutor = {
    action: 'load_page_context',
    async run(ctx) {
        const assessed = (0, page_context_usage_util_1.assessPageContextData)((0, executor_host_util_1.resolveExecutorPageContext)(ctx.host));
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        const workflowRun = (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef);
        return {
            kind: 'completed',
            workflowRun,
            outputRef,
            nodeOutput: assessed,
        };
    },
};
//# sourceMappingURL=load-page-context.executor.js.map