"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyActionForDirectIrType = exports.isIrDirectExecutorType = exports.mapIrTypeToLegacyAction = exports.IR_DIRECT_EXECUTOR_TYPES = void 0;
const IR_TO_LEGACY = {
    data_query: { kind: 'direct', action: 'fetch_data' },
    structured_output: { kind: 'direct', action: 'detect_clues' },
    host_effect: { kind: 'direct', action: 'generate_and_push' },
    message_send: { kind: 'direct', action: 'summarize' },
    tool_call: { kind: 'direct', action: 'write_data' },
    data_transform: {
        kind: 'expand',
        actions: ['compose_mutation'],
        note: '仅 purpose=compose_mutation 时展开；否则物化失败',
    },
    llm: {
        kind: 'expand',
        actions: ['summarize_images', 'summarize'],
        note: 'vision → summarize_images；否则 draft summarize',
    },
    human_task: {
        kind: 'expand',
        actions: ['present_mutation', 'await_user_confirm'],
        note: '标准仅 await；explainBeforeConfirm===true 时才串 present→await',
    },
    condition: {
        kind: 'none',
        note: '编译为边 when，不落 IR 节点',
    },
    router: {
        kind: 'none',
        note: '编译为边 when/default，不落 IR 节点',
    },
};
exports.IR_DIRECT_EXECUTOR_TYPES = [
    'data_query',
    'structured_output',
    'host_effect',
    'message_send',
    'tool_call',
];
function mapIrTypeToLegacyAction(type) {
    var _a;
    return ((_a = IR_TO_LEGACY[type]) !== null && _a !== void 0 ? _a : {
        kind: 'none',
        note: `IR type "${type}" has no legacy mapping yet`,
    });
}
exports.mapIrTypeToLegacyAction = mapIrTypeToLegacyAction;
function isIrDirectExecutorType(type) {
    return exports.IR_DIRECT_EXECUTOR_TYPES.includes(type);
}
exports.isIrDirectExecutorType = isIrDirectExecutorType;
function legacyActionForDirectIrType(type) {
    const mapped = mapIrTypeToLegacyAction(type);
    return mapped.kind === 'direct' ? mapped.action : null;
}
exports.legacyActionForDirectIrType = legacyActionForDirectIrType;
//# sourceMappingURL=map-ir-type-to-legacy-action.util.js.map