"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkflowIntentOperation = exports.WORKFLOW_INTENT_VERSION = void 0;
exports.WORKFLOW_INTENT_VERSION = 1;
function isWorkflowIntentOperation(value) {
    return (value === 'read' ||
        value === 'judge' ||
        value === 'deliver' ||
        value === 'mutate');
}
exports.isWorkflowIntentOperation = isWorkflowIntentOperation;
//# sourceMappingURL=workflow-intent.types.js.map