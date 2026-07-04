"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPageWorkflowRunnerResult = exports.createPageWorkflowExecutorRuntime = void 0;
function createPageWorkflowExecutorRuntime(input, recorder) {
    var _a;
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
        res: input.res,
        hostTool: input.hostTool,
        stepRecorder: recorder,
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
    return {
        workflowRun: input.workflowRun,
        steps: input.recorder.toJson(),
        fillText: input.runtime.fillText,
        dslOutcome: input.runtime.dslOutcome,
        model: input.runtime.metrics.model,
        promptTokens: input.runtime.metrics.promptTokens,
        completionTokens: input.runtime.metrics.completionTokens,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
    };
}
exports.buildPageWorkflowRunnerResult = buildPageWorkflowRunnerResult;
//# sourceMappingURL=page-workflow-runtime.util.js.map