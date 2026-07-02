"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowProfileAllowsAction = exports.isWorkflowActionKind = exports.getWorkflowActionRegistryEntry = exports.WORKFLOW_ACTION_KINDS = exports.WORKFLOW_ACTION_REGISTRY = void 0;
exports.WORKFLOW_ACTION_REGISTRY = [
    {
        kind: 'load_page_context',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'A',
    },
    {
        kind: 'fetch_data',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'A',
    },
    {
        kind: 'generate_and_push',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'A',
    },
    {
        kind: 'summarize',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'A',
    },
    {
        kind: 'compose_mutation',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'B',
    },
    {
        kind: 'present_mutation',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'B',
    },
    {
        kind: 'write_data',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'B',
    },
    {
        kind: 'await_user_confirm',
        implemented: true,
        allowedProfiles: ['page_action', 'chat_skill', 'shared'],
        batch: 'B',
    },
];
exports.WORKFLOW_ACTION_KINDS = exports.WORKFLOW_ACTION_REGISTRY.map((entry) => entry.kind);
function getWorkflowActionRegistryEntry(kind) {
    var _a;
    return ((_a = exports.WORKFLOW_ACTION_REGISTRY.find((entry) => entry.kind === kind)) !== null && _a !== void 0 ? _a : null);
}
exports.getWorkflowActionRegistryEntry = getWorkflowActionRegistryEntry;
function isWorkflowActionKind(value) {
    return getWorkflowActionRegistryEntry(value) != null;
}
exports.isWorkflowActionKind = isWorkflowActionKind;
function workflowProfileAllowsAction(_profile, kind) {
    const entry = getWorkflowActionRegistryEntry(kind);
    return (entry === null || entry === void 0 ? void 0 : entry.implemented) === true;
}
exports.workflowProfileAllowsAction = workflowProfileAllowsAction;
//# sourceMappingURL=workflow-action-registry.js.map