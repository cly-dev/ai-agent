"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageWorkflowRunnerResult = exports.createPageWorkflowExecutorRuntime = void 0;
const page_action_run_completion_util_1 = require("./page-action-run-completion.util");
function createPageWorkflowExecutorRuntime(input, recorder) {
    var _a, _b;
    return {
        pageContext: input.pageContext,
        messages: input.messages,
        nodeOutputs: {},
        systemPrompt: input.systemPrompt,
        objectivePrefix: input.objectivePrefix,
        llmService: input.llmService,
        prisma: input.prisma,
        toolEngine: input.toolEngine,
        userId: input.userId,
        appClientId: input.appClientId,
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        generation: input.generation,
        clientActionId: (_a = input.clientActionId) !== null && _a !== void 0 ? _a : null,
        sseSink: input.sseSink,
        hostTool: input.hostTool,
        stepRecorder: recorder,
        toolBundle: (_b = input.toolBundle) !== null && _b !== void 0 ? _b : null,
        fillText: '',
        dslOutcome: null,
        metrics: {
            model: null,
            promptTokens: null,
            completionTokens: null,
        },
    };
}
exports.createPageWorkflowExecutorRuntime = createPageWorkflowExecutorRuntime;
function buildPageWorkflowRunnerResult(input) {
    const completion = (0, page_action_run_completion_util_1.resolvePageWorkflowCompletion)({
        workflowNodes: input.workflowNodes,
        workflowRun: input.workflowRun,
        runtime: input.runtime,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        suspended: input.suspended,
        approvalRequestId: input.approvalRequestId,
    });
    return {
        workflowRun: input.workflowRun,
        steps: input.recorder.toJson(),
        fillText: input.runtime.fillText,
        dslOutcome: input.runtime.dslOutcome,
        model: input.runtime.metrics.model,
        promptTokens: input.runtime.metrics.promptTokens,
        completionTokens: input.runtime.metrics.completionTokens,
        completion,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
    };
}
exports.buildPageWorkflowRunnerResult = buildPageWorkflowRunnerResult;
//# sourceMappingURL=page-workflow-runtime.util.js.map