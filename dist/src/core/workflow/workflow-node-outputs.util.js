"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendWorkflowNodeOutputsToLlmMessages = exports.formatWorkflowNodeOutputsForPrompt = exports.workflowNodeOutputsToSummarizeObservations = exports.formatPriorOutputsForDetectClues = exports.compactWorkflowNodeOutputForSummarize = void 0;
const workflow_node_outputs_summarize_util_1 = require("./workflow-node-outputs-summarize.util");
Object.defineProperty(exports, "compactWorkflowNodeOutputForSummarize", { enumerable: true, get: function () { return workflow_node_outputs_summarize_util_1.compactWorkflowNodeOutputForSummarize; } });
Object.defineProperty(exports, "formatPriorOutputsForDetectClues", { enumerable: true, get: function () { return workflow_node_outputs_summarize_util_1.formatPriorOutputsForDetectClues; } });
Object.defineProperty(exports, "workflowNodeOutputsToSummarizeObservations", { enumerable: true, get: function () { return workflow_node_outputs_summarize_util_1.workflowNodeOutputsToSummarizeObservations; } });
function formatWorkflowNodeOutputsForPrompt(nodeOutputs) {
    const entries = Object.entries(nodeOutputs);
    if (entries.length === 0) {
        return null;
    }
    return entries
        .map(([ref, value]) => {
        const compact = (0, workflow_node_outputs_summarize_util_1.compactWorkflowNodeOutputForSummarize)(ref, value);
        return `## ${ref}\n\`\`\`json\n${JSON.stringify(compact, null, 2)}\n\`\`\``;
    })
        .join('\n\n');
}
exports.formatWorkflowNodeOutputsForPrompt = formatWorkflowNodeOutputsForPrompt;
function appendWorkflowNodeOutputsToLlmMessages(messages, nodeOutputs) {
    if (!nodeOutputs || Object.keys(nodeOutputs).length === 0) {
        return messages;
    }
    const body = formatWorkflowNodeOutputsForPrompt(nodeOutputs);
    if (!body) {
        return messages;
    }
    return [
        ...messages,
        {
            role: 'user',
            content: `Prior workflow step outputs:\n\n${body}`,
        },
    ];
}
exports.appendWorkflowNodeOutputsToLlmMessages = appendWorkflowNodeOutputsToLlmMessages;
//# sourceMappingURL=workflow-node-outputs.util.js.map