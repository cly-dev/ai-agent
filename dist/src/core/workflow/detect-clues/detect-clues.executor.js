"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectCluesExecutor = void 0;
const workflow_run_util_1 = require("../workflow-run.util");
const workflow_node_output_util_1 = require("../workflow-node-output.util");
const workflow_run_advance_util_1 = require("../graph/workflow-run-advance.util");
const workflow_edge_util_1 = require("../graph/workflow-edge.util");
const executor_host_util_1 = require("../executors/executor-host.util");
const detect_clues_llm_util_1 = require("./detect-clues-llm.util");
const workflow_node_outputs_summarize_util_1 = require("../workflow-node-outputs-summarize.util");
const resolve_workflow_node_runtime_input_util_1 = require("../resolve-workflow-node-runtime-input.util");
function resolveDetectHint(input) {
    if (input == null || typeof input !== 'object') {
        return undefined;
    }
    const hint = input.hint;
    return typeof hint === 'string' && hint.trim() ? hint.trim() : undefined;
}
function summarizeForDetect(value, maxLen = 4000) {
    try {
        const text = JSON.stringify(value);
        if (text.length <= maxLen) {
            return text;
        }
        return `${text.slice(0, maxLen)}…`;
    }
    catch (_a) {
        return String(value);
    }
}
function resolvePriorOutputs(host) {
    var _a;
    if (host.profile === 'page') {
        return host.runtime.nodeOutputs;
    }
    return (_a = host.state.workflowNodeOutputs) !== null && _a !== void 0 ? _a : {};
}
function resolveUserMessage(host) {
    if (host.profile === 'page') {
        const lastUser = [...host.runtime.messages]
            .reverse()
            .find((row) => row.role === 'user');
        return typeof (lastUser === null || lastUser === void 0 ? void 0 : lastUser.content) === 'string' ? lastUser.content : '';
    }
    return host.bundle.ctx.input.latestUserMessage;
}
function resolveLlmService(host) {
    if (host.profile === 'page') {
        return host.runtime.llmService;
    }
    return host.bundle.deps.llmService;
}
exports.detectCluesExecutor = {
    action: 'detect_clues',
    async run(ctx) {
        var _a;
        const edges = (_a = ctx.workflowRun.edges) !== null && _a !== void 0 ? _a : [];
        const clueEdges = (0, workflow_edge_util_1.listClueEdgesFrom)(edges, ctx.nodeId);
        const clues = clueEdges
            .map((edge) => edge.clue)
            .filter((row) => row != null);
        const pageContext = (0, executor_host_util_1.resolveExecutorPageContext)(ctx.host);
        const priorOutputs = resolvePriorOutputs(ctx.host);
        const llmService = resolveLlmService(ctx.host);
        const output = await (0, detect_clues_llm_util_1.invokeDetectCluesLlm)({
            llmService,
            objective: ctx.def.objective,
            hint: resolveDetectHint((0, resolve_workflow_node_runtime_input_util_1.resolveWorkflowNodeRuntimeInput)(ctx.def)),
            clues,
            userMessage: resolveUserMessage(ctx.host),
            pageContextSummary: summarizeForDetect(pageContext !== null && pageContext !== void 0 ? pageContext : null),
            priorOutputsSummary: (0, workflow_node_outputs_summarize_util_1.formatPriorOutputsForDetectClues)(priorOutputs),
        });
        if (!output) {
            const failed = (0, workflow_run_util_1.failWorkflowNode)(ctx.workflowRun, ctx.nodeId, {
                code: 'DETECT_CLUES_LLM_FAILED',
                message: 'detect_clues LLM failed or returned invalid structured output',
            });
            return {
                kind: 'failed',
                workflowRun: failed,
                error: failed.nodes.find((row) => row.nodeId === ctx.nodeId).error,
            };
        }
        if (output.matchedClueKeys.length === 0 &&
            !edges.some((edge) => { var _a; return edge.from === ctx.nodeId && ((_a = edge.kind) !== null && _a !== void 0 ? _a : 'always') === 'default'; }) &&
            clues.length > 0) {
            const failed = (0, workflow_run_util_1.failWorkflowNode)(ctx.workflowRun, ctx.nodeId, {
                code: 'DETECT_CLUES_NO_ROUTE',
                message: 'detect_clues matched nothing and no default edge is configured',
            });
            return {
                kind: 'failed',
                workflowRun: failed,
                error: failed.nodes.find((row) => row.nodeId === ctx.nodeId).error,
            };
        }
        const outputRef = (0, workflow_node_output_util_1.buildWorkflowNodeOutputRef)(ctx.def.action, ctx.nodeId);
        let workflowRun = (0, workflow_run_util_1.completeWorkflowNode)(ctx.workflowRun, ctx.nodeId, outputRef);
        workflowRun = (0, workflow_run_advance_util_1.applyDetectCluesRouting)({
            run: workflowRun,
            edges,
            fromNodeId: ctx.nodeId,
            output,
        });
        return {
            kind: 'completed',
            workflowRun,
            outputRef,
            nodeOutput: output,
        };
    },
};
//# sourceMappingURL=detect-clues.executor.js.map