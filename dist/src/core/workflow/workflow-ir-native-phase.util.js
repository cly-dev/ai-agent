"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextWorkflowIrNativePhase = exports.materializeWorkflowIrNodeForPhase = exports.actionForWorkflowIrNativePhase = exports.resolveWorkflowIrNativePhases = void 0;
const derive_workflow_node_input_from_ir_util_1 = require("./derive-workflow-node-input-from-ir.util");
function objectiveFromIrNode(node) {
    var _a, _b;
    const cfg = (_a = node.config) !== null && _a !== void 0 ? _a : {};
    return typeof cfg.objective === 'string'
        ? cfg.objective
        : ((_b = node.name) !== null && _b !== void 0 ? _b : node.type);
}
function stamp(node, def) {
    var _a;
    return Object.assign(Object.assign({}, def), { irType: node.type, irNodeId: node.id, irConfig: (_a = node.config) !== null && _a !== void 0 ? _a : {} });
}
function inputFor(node, action) {
    var _a;
    const derived = (0, derive_workflow_node_input_from_ir_util_1.deriveWorkflowNodeInputFromIr)({
        irType: node.type,
        config: (_a = node.config) !== null && _a !== void 0 ? _a : {},
        action,
    });
    if (derived == null) {
        throw new Error(`native phase: cannot derive input for ${node.type} → ${action}`);
    }
    return derived;
}
function resolveWorkflowIrNativePhases(node) {
    var _a, _b;
    const cfg = (_a = node.config) !== null && _a !== void 0 ? _a : {};
    switch (node.type) {
        case 'human_task':
            if (cfg.explainBeforeConfirm === true) {
                return ['present', 'await'];
            }
            return ['await'];
        case 'llm':
            if ((_b = cfg.capabilities) === null || _b === void 0 ? void 0 : _b.vision) {
                return ['execute'];
            }
            return ['draft'];
        default:
            return ['execute'];
    }
}
exports.resolveWorkflowIrNativePhases = resolveWorkflowIrNativePhases;
function actionForWorkflowIrNativePhase(node, phase) {
    var _a, _b;
    switch (phase) {
        case 'present':
            return 'present_mutation';
        case 'await':
            return 'await_user_confirm';
        case 'draft':
            return 'summarize';
        case 'execute':
            break;
    }
    switch (node.type) {
        case 'data_query':
            return 'fetch_data';
        case 'structured_output':
            return 'detect_clues';
        case 'host_effect':
            return 'generate_and_push';
        case 'message_send':
            return 'summarize';
        case 'tool_call':
            return 'write_data';
        case 'data_transform':
            return 'compose_mutation';
        case 'llm':
            return ((_b = (_a = node.config) === null || _a === void 0 ? void 0 : _a.capabilities) === null || _b === void 0 ? void 0 : _b.vision)
                ? 'summarize_images'
                : 'summarize';
        case 'human_task':
            return 'await_user_confirm';
        default:
            throw new Error(`actionForWorkflowIrNativePhase: unsupported IR type ${node.type}`);
    }
}
exports.actionForWorkflowIrNativePhase = actionForWorkflowIrNativePhase;
function materializeWorkflowIrNodeForPhase(node, phase) {
    var _a, _b, _c;
    const action = actionForWorkflowIrNativePhase(node, phase);
    const objective = objectiveFromIrNode(node);
    const name = phase === 'present'
        ? '展示变更草稿'
        : phase === 'await'
            ? ((_a = node.name) !== null && _a !== void 0 ? _a : '等待用户确认')
            : phase === 'draft'
                ? ((_b = node.name) !== null && _b !== void 0 ? _b : '生成')
                : ((_c = node.name) !== null && _c !== void 0 ? _c : node.type);
    return stamp(node, {
        id: node.id,
        action,
        name,
        objective: phase === 'present' ? 'Present the pending mutation draft.' : objective,
        input: inputFor(node, action),
    });
}
exports.materializeWorkflowIrNodeForPhase = materializeWorkflowIrNodeForPhase;
function nextWorkflowIrNativePhase(node, current) {
    const phases = resolveWorkflowIrNativePhases(node);
    const index = phases.indexOf(current);
    if (index < 0 || index >= phases.length - 1) {
        return null;
    }
    return phases[index + 1];
}
exports.nextWorkflowIrNativePhase = nextWorkflowIrNativePhase;
//# sourceMappingURL=workflow-ir-native-phase.util.js.map