"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowIrCategoryOf = exports.WORKFLOW_IR_BANNED_LEGACY_ACTIONS = exports.WORKFLOW_IR_IMPLEMENTED_TYPES = void 0;
exports.WORKFLOW_IR_IMPLEMENTED_TYPES = [
    'data_query',
    'data_transform',
    'llm',
    'structured_output',
    'tool_call',
    'host_effect',
    'message_send',
    'human_task',
];
exports.WORKFLOW_IR_BANNED_LEGACY_ACTIONS = [
    'load_page_context',
    'summarize_images',
    'detect_clues',
    'generate_and_push',
];
function workflowIrCategoryOf(type) {
    switch (type) {
        case 'event_trigger':
        case 'schedule_trigger':
        case 'webhook_trigger':
            return 'trigger';
        case 'context_read':
        case 'data_query':
        case 'data_transform':
        case 'merge':
            return 'data';
        case 'llm':
        case 'structured_output':
        case 'embedding':
        case 'retrieval':
        case 'rerank':
            return 'ai';
        case 'condition':
        case 'router':
        case 'parallel':
        case 'join':
        case 'loop':
        case 'delay':
            return 'control';
        case 'tool_call':
        case 'http_call':
        case 'host_effect':
        case 'message_send':
        case 'human_task':
            return 'action';
        case 'catch_error':
        case 'sub_workflow':
            return 'system';
        default: {
            const _exhaustive = type;
            return _exhaustive;
        }
    }
}
exports.workflowIrCategoryOf = workflowIrCategoryOf;
//# sourceMappingURL=workflow-ir.types.js.map