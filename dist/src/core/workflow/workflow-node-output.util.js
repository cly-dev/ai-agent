"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWorkflowNodeOutputRef = void 0;
function buildWorkflowNodeOutputRef(action, nodeId) {
    return `obs:${action}:${nodeId}`;
}
exports.buildWorkflowNodeOutputRef = buildWorkflowNodeOutputRef;
//# sourceMappingURL=workflow-node-output.util.js.map