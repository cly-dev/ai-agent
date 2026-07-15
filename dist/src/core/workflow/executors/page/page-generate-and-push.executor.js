"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageGenerateAndPushExecutor = void 0;
const common_1 = require("@nestjs/common");
const page_action_host_fill_executor_1 = require("../../../page-action/page-action-host-fill.executor");
const page_workflow_messages_util_1 = require("../../../page-action/page-workflow-messages.util");
const page_workflow_node_util_1 = require("../../../page-action/page-workflow-node.util");
const workflow_run_util_1 = require("../../workflow-run.util");
const workflow_node_output_util_1 = require("../../workflow-node-output.util");
const page_action_workflow_host_util_1 = require("../../../page-action/page-action-workflow-host.util");
const page_action_structured_produce_util_1 = require("../../../page-action/page-action-structured-produce.util");
const host_action_instant_dispatch_util_1 = require("../../../host-bridge/host-action-instant-dispatch.util");
const page_action_inline_sse_util_1 = require("../../../page-action/page-action-inline-sse.util");
const page_action_constants_1 = require("../../../page-action/page-action.constants");
const executor_host_util_1 = require("../executor-host.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
exports.pageGenerateAndPushExecutor = {
    action: 'generate_and_push',
    async run(ctx) {
        var _a, _b, _c;
        const { runtime } = (0, executor_host_util_1.requirePageExecutorHost)(ctx.host);
        const nodeInput = (isRecord(ctx.def.input) ? ctx.def.input : {});
        const hostTools = await (0, page_action_workflow_host_util_1.resolvePageActionHostToolsForPushNode)(runtime.prisma, {
            appClientId: runtime.appClientId,
            nodeInput,
            pageContext: runtime.pageContext,
            fallbackHostTool: runtime.hostTool,
        });
        const messages = (0, page_workflow_messages_util_1.injectWorkflowNodeObjective)((0, page_workflow_messages_util_1.appendWorkflowNodeOutputsToMessages)(runtime.messages, runtime.nodeOutputs), ctx.def.objective, runtime.objectivePrefix);
        if (hostTools.length === 1) {
            const fillResult = await (0, page_action_host_fill_executor_1.executePageActionHostFill)(runtime.llmService, {
                actionRunId: runtime.actionRunId,
                actionKey: runtime.actionKey,
                generation: runtime.generation,
                clientActionId: (_a = runtime.clientActionId) !== null && _a !== void 0 ? _a : null,
                systemPrompt: runtime.systemPrompt,
                messages,
                pageContext: runtime.pageContext,
                actionContext: (_b = runtime.actionContext) !== null && _b !== void 0 ? _b : null,
                hostTool: hostTools[0],
                sseSink: runtime.sseSink,
                stepRecorder: runtime.stepRecorder,
                terminalLifecycle: 'delegated',
                streamIdSegment: ctx.nodeId,
            });
            runtime.fillText = fillResult.fillText;
            runtime.dslOutcome = fillResult.dslOutcome;
            (0, page_workflow_node_util_1.mergePageWorkflowLlmMetrics)(runtime.metrics, fillResult);
        }
        else {
            const produced = await (0, page_action_structured_produce_util_1.produceHostToolCallAmongCandidates)({
                llmService: runtime.llmService,
                messages,
                hostTools: hostTools.map((row) => row.definition),
                actionContext: (_c = runtime.actionContext) !== null && _c !== void 0 ? _c : null,
                actionRunId: runtime.actionRunId,
                actionKey: runtime.actionKey,
                budgetHints: { callKind: 'decision' },
            });
            (0, page_workflow_node_util_1.mergePageWorkflowLlmMetrics)(runtime.metrics, {
                model: produced.model,
                promptTokens: produced.promptTokens,
                completionTokens: produced.completionTokens,
            });
            if (produced.ok !== true || !produced.hostTool) {
                throw new common_1.BadRequestException({
                    code: 'HOST_TOOL_CHOICE_FAILED',
                    message: produced.ok === false ? produced.error : 'host tool choice failed',
                });
            }
            const publish = (0, page_action_inline_sse_util_1.createInlineHostActionPublisher)(runtime.sseSink, {
                onPayload: (payload) => {
                    runtime.stepRecorder.recordHostActionPayload(payload);
                },
            });
            const streamId = (0, page_action_constants_1.buildPageActionStreamId)({
                actionRunId: runtime.actionRunId,
                actionKey: runtime.actionKey,
                segment: ctx.nodeId,
            });
            (0, host_action_instant_dispatch_util_1.dispatchHostActionInstant)(publish, `page-action:${runtime.actionRunId}`, {
                pageContext: runtime.pageContext,
                runId: runtime.actionRunId,
                turnId: runtime.actionRunId,
                hostTools: [{ name: produced.hostTool.name, args: produced.args }],
                reason: page_action_constants_1.PAGE_ACTION_STREAM_REASON,
                streamId,
                generation: runtime.generation,
            });
            runtime.fillText = JSON.stringify(produced.args);
            runtime.dslOutcome = 'dispatched';
            runtime.stepRecorder.record({
                type: 'dsl',
                name: 'instant.dispatched',
                status: 'ok',
                detail: {
                    delivery: 'instant',
                    producePath: 'tool_call_multi',
                    tool: produced.hostTool.name,
                    argKeys: Object.keys(produced.args),
                },
            });
        }
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        const nodeOutput = {
            fillText: runtime.fillText,
            dslOutcome: runtime.dslOutcome,
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