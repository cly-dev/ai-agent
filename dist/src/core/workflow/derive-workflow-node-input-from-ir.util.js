"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveWorkflowNodeInputFromIr = void 0;
function deriveWorkflowNodeInputFromIr(input) {
    var _a, _b, _c;
    const cfg = input.config;
    switch (input.irType) {
        case 'data_query':
            if (input.action !== 'fetch_data')
                return null;
            return {
                toolIds: Array.isArray(cfg.toolIds)
                    ? cfg.toolIds
                    : undefined,
                completeWhen: cfg.completeWhen,
            };
        case 'host_effect':
            if (input.action !== 'generate_and_push')
                return null;
            return {
                hostToolIds: Array.isArray(cfg.hostToolIds)
                    ? cfg.hostToolIds
                    : undefined,
            };
        case 'message_send':
            if (input.action !== 'summarize')
                return null;
            return {
                mode: (_a = cfg.mode) !== null && _a !== void 0 ? _a : 'final',
                stream: cfg.stream,
            };
        case 'structured_output':
            if (input.action !== 'detect_clues')
                return null;
            return { hint: cfg.hint };
        case 'tool_call':
            if (input.action !== 'write_data')
                return null;
            return {
                toolId: cfg.toolId,
                useComposedArgs: cfg.useComposedArgs !== false,
            };
        case 'llm':
            if (input.action === 'summarize_images') {
                return {
                    from: cfg.from,
                    maxCells: cfg.maxCells,
                    maxGroups: cfg.maxGroups,
                    maxCellsPerGroup: cfg.maxCellsPerGroup,
                    hint: cfg.hint,
                    onFailure: cfg.onFailure,
                    cacheTtlSec: cfg.cacheTtlSec,
                };
            }
            if (input.action === 'summarize') {
                return { mode: 'draft', stream: false };
            }
            return null;
        case 'data_transform':
            if (input.action !== 'compose_mutation' ||
                cfg.purpose !== 'compose_mutation') {
                return null;
            }
            return { toolId: cfg.toolId };
        case 'human_task':
            if (input.action === 'present_mutation') {
                return {
                    mode: (_b = cfg.presentMode) !== null && _b !== void 0 ? _b : 'brief',
                };
            }
            if (input.action === 'await_user_confirm') {
                return {
                    confirmKind: (_c = cfg.kind) !== null && _c !== void 0 ? _c : 'mutation',
                };
            }
            return null;
        default:
            return null;
    }
}
exports.deriveWorkflowNodeInputFromIr = deriveWorkflowNodeInputFromIr;
//# sourceMappingURL=derive-workflow-node-input-from-ir.util.js.map