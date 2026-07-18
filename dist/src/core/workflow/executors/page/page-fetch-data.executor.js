"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageFetchDataExecutor = void 0;
const page_workflow_fetch_data_util_1 = require("../../../page-action/page-workflow-fetch-data.util");
const page_workflow_messages_util_1 = require("../../../page-action/page-workflow-messages.util");
const workflow_run_util_1 = require("../../workflow-run.util");
const workflow_node_output_util_1 = require("../../workflow-node-output.util");
const resolve_workflow_node_runtime_input_util_1 = require("../../resolve-workflow-node-runtime-input.util");
const executor_host_util_1 = require("../executor-host.util");
const entity_materialization_1 = require("../../../entity-materialization");
const tool_output_projection_util_1 = require("../../../tool-engine/tool-output-projection.util");
exports.pageFetchDataExecutor = {
    action: 'fetch_data',
    async run(ctx) {
        var _a, _b;
        const { runtime } = (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        const nodeInput = (0, resolve_workflow_node_runtime_input_util_1.resolveWorkflowNodeRuntimeInput)(ctx.def);
        const observation = await (0, page_workflow_fetch_data_util_1.executePageWorkflowFetchData)({
            prisma: runtime.prisma,
            toolEngine: runtime.toolEngine,
            userId: runtime.userId,
            appClientId: runtime.appClientId,
            nodeInput,
            pageContext: runtime.pageContext,
            stepRecorder: runtime.stepRecorder,
            nodeId: ctx.nodeId,
            toolBundle: runtime.toolBundle,
            llmService: runtime.llmService,
            messages: (0, page_workflow_messages_util_1.appendWorkflowNodeOutputsToMessages)(runtime.messages, runtime.nodeOutputs),
            nodeObjective: ctx.def.objective,
        });
        const resolvedTool = (_b = (_a = runtime.toolBundle) === null || _a === void 0 ? void 0 : _a.toolById.get(observation.toolId)) !== null && _b !== void 0 ? _b : null;
        const upstreamEntities = (0, entity_materialization_1.materializeEntitiesFromToolOutput)({
            raw: observation.output,
            profile: (0, tool_output_projection_util_1.parseResponseProfile)(resolvedTool === null || resolvedTool === void 0 ? void 0 : resolvedTool.responseProfile),
        });
        if (upstreamEntities.length > 0) {
            runtime.materializedEntities = (0, entity_materialization_1.mergeMaterializedEntities)(runtime.materializedEntities, upstreamEntities);
            (0, entity_materialization_1.recordPageActionEntityMaterialization)(runtime.stepRecorder, runtime.materializedEntities, { name: 'entity_materialization_upstream' });
        }
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