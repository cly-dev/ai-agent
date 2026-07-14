"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectWorkflowNodeObjective = exports.appendWorkflowNodeOutputsToMessages = void 0;
const workflow_node_outputs_util_1 = require("../workflow/workflow-node-outputs.util");
function appendWorkflowNodeOutputsToMessages(messages, nodeOutputs) {
    return (0, workflow_node_outputs_util_1.appendWorkflowNodeOutputsToLlmMessages)(messages, nodeOutputs);
}
exports.appendWorkflowNodeOutputsToMessages = appendWorkflowNodeOutputsToMessages;
function injectWorkflowNodeObjective(messages, objective, prefix) {
    const text = (prefix === null || prefix === void 0 ? void 0 : prefix.trim())
        ? `${prefix.trim()}\n\n${objective}`
        : objective;
    return [
        ...messages,
        {
            role: 'user',
            content: text,
        },
    ];
}
exports.injectWorkflowNodeObjective = injectWorkflowNodeObjective;
//# sourceMappingURL=page-workflow-messages.util.js.map