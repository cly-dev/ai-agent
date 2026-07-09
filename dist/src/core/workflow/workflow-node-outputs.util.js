"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendWorkflowNodeOutputsToLlmMessages = exports.formatWorkflowNodeOutputsForPrompt = void 0;
function formatWorkflowNodeOutputsForPrompt(nodeOutputs) {
    const entries = Object.entries(nodeOutputs);
    if (entries.length === 0) {
        return null;
    }
    return entries
        .map(([ref, value]) => `## ${ref}\n\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``)
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