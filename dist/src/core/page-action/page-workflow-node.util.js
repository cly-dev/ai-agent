"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyPageWorkflowNodeOutput = exports.buildPageHarnessSensorPayload = exports.applySummarizeFillText = exports.mergePageWorkflowLlmMetrics = exports.runPageWorkflowHarnessSensors = exports.buildPageWorkflowOutputRef = void 0;
const harness_trace_util_1 = require("../harness/trace/harness-trace.util");
const workflow_node_output_util_1 = require("../workflow/workflow-node-output.util");
Object.defineProperty(exports, "buildPageWorkflowOutputRef", { enumerable: true, get: function () { return workflow_node_output_util_1.buildWorkflowNodeOutputRef; } });
async function runPageWorkflowHarnessSensors(input) {
    const sensorRun = await input.harness.runAfterNodeSensors({
        ctx: { nodeId: input.nodeId, action: input.action, profile: 'page' },
        payload: input.payload,
    });
    if (sensorRun.trace.length > 0) {
        input.recorder.record({
            type: 'harness',
            name: `${input.nodeId}:sensors`,
            detail: (0, harness_trace_util_1.harnessTraceToAgentStepOutput)(sensorRun.trace),
            status: sensorRun.sensorFailed ? 'failed' : 'ok',
        });
    }
    return sensorRun.sensorFailed;
}
exports.runPageWorkflowHarnessSensors = runPageWorkflowHarnessSensors;
function mergePageWorkflowLlmMetrics(current, next) {
    var _a, _b;
    if (next.model) {
        current.model = next.model;
    }
    if (next.promptTokens != null) {
        current.promptTokens = ((_a = current.promptTokens) !== null && _a !== void 0 ? _a : 0) + next.promptTokens;
    }
    if (next.completionTokens != null) {
        current.completionTokens =
            ((_b = current.completionTokens) !== null && _b !== void 0 ? _b : 0) + next.completionTokens;
    }
}
exports.mergePageWorkflowLlmMetrics = mergePageWorkflowLlmMetrics;
function applySummarizeFillText(input) {
    if (input.mode === 'draft' || input.fillText.trim()) {
        return input.fillText;
    }
    const summaryText = input.summaryText.trim();
    return summaryText.length > 0 ? summaryText : input.fillText;
}
exports.applySummarizeFillText = applySummarizeFillText;
function buildPageHarnessSensorPayload(action, outcome) {
    var _a, _b, _c, _d;
    const nodeOutput = outcome.nodeOutput;
    switch (action) {
        case 'generate_and_push':
            return nodeOutput !== null && nodeOutput !== void 0 ? nodeOutput : {};
        case 'fetch_data': {
            const row = (nodeOutput !== null && nodeOutput !== void 0 ? nodeOutput : {});
            return {
                observations: [
                    { name: (_a = row.toolName) !== null && _a !== void 0 ? _a : 'tool', output: row.output },
                ],
                toolName: row.toolName,
                toolId: row.toolId,
                agentMetadata: (_b = row.agentMetadata) !== null && _b !== void 0 ? _b : null,
            };
        }
        case 'summarize':
        case 'present_mutation': {
            const row = (nodeOutput !== null && nodeOutput !== void 0 ? nodeOutput : {});
            return {
                summaryText: (_c = row.summaryText) !== null && _c !== void 0 ? _c : '',
                mode: (_d = row.mode) !== null && _d !== void 0 ? _d : (action === 'present_mutation' ? 'brief' : 'final'),
            };
        }
        default:
            return {};
    }
}
exports.buildPageHarnessSensorPayload = buildPageHarnessSensorPayload;
function applyPageWorkflowNodeOutput(runtime, outcome) {
    var _a;
    if (outcome.outputRef != null && outcome.nodeOutput !== undefined) {
        runtime.nodeOutputs[outcome.outputRef] = outcome.nodeOutput;
    }
    if (outcome.nodeOutput &&
        typeof outcome.nodeOutput === 'object' &&
        !Array.isArray(outcome.nodeOutput)) {
        const row = outcome.nodeOutput;
        if (typeof row.summaryText === 'string') {
            runtime.fillText = applySummarizeFillText({
                fillText: runtime.fillText,
                summaryText: row.summaryText,
                mode: (_a = row.mode) !== null && _a !== void 0 ? _a : 'final',
            });
        }
    }
}
exports.applyPageWorkflowNodeOutput = applyPageWorkflowNodeOutput;
//# sourceMappingURL=page-workflow-node.util.js.map