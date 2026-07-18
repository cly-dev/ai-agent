"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowIrNeedsLegacyLower = exports.materializeWorkflowGraphFromIr = exports.workflowIrHasExpandTypes = exports.materializeIrNodeToDefs = exports.materializeExpandIrNode = exports.materializeDirectIrNode = void 0;
const derive_workflow_node_input_from_ir_util_1 = require("./derive-workflow-node-input-from-ir.util");
const map_ir_type_to_legacy_action_util_1 = require("./map-ir-type-to-legacy-action.util");
function objectiveFromIrNode(node) {
    var _a, _b;
    const cfg = (_a = node.config) !== null && _a !== void 0 ? _a : {};
    return typeof cfg.objective === 'string'
        ? cfg.objective
        : ((_b = node.name) !== null && _b !== void 0 ? _b : node.type);
}
function stampIrProvenance(node, def) {
    var _a;
    return Object.assign(Object.assign({}, def), { irType: node.type, irNodeId: node.id, irConfig: (_a = node.config) !== null && _a !== void 0 ? _a : {} });
}
function inputFromIr(node, action) {
    var _a;
    const derived = (0, derive_workflow_node_input_from_ir_util_1.deriveWorkflowNodeInputFromIr)({
        irType: node.type,
        config: (_a = node.config) !== null && _a !== void 0 ? _a : {},
        action,
    });
    if (derived == null) {
        throw new Error(`materialize: cannot derive input for IR ${node.type} → ${action}`);
    }
    return derived;
}
function materializeDirectIrNode(node) {
    var _a, _b, _c, _d, _e;
    const objective = objectiveFromIrNode(node);
    const mapping = (0, map_ir_type_to_legacy_action_util_1.mapIrTypeToLegacyAction)(node.type);
    if (mapping.kind !== 'direct') {
        throw new Error(`materializeDirectIrNode: IR type "${node.type}" is not direct`);
    }
    switch (node.type) {
        case 'data_query':
            return stampIrProvenance(node, {
                id: node.id,
                action: 'fetch_data',
                name: (_a = node.name) !== null && _a !== void 0 ? _a : '获取数据',
                objective,
                input: inputFromIr(node, 'fetch_data'),
            });
        case 'host_effect':
            return stampIrProvenance(node, {
                id: node.id,
                action: 'generate_and_push',
                name: (_b = node.name) !== null && _b !== void 0 ? _b : '推送到页面',
                objective,
                input: inputFromIr(node, 'generate_and_push'),
            });
        case 'message_send':
            return stampIrProvenance(node, {
                id: node.id,
                action: 'summarize',
                name: (_c = node.name) !== null && _c !== void 0 ? _c : '说明总结',
                objective,
                input: inputFromIr(node, 'summarize'),
            });
        case 'structured_output':
            return stampIrProvenance(node, {
                id: node.id,
                action: 'detect_clues',
                name: (_d = node.name) !== null && _d !== void 0 ? _d : '状态识别',
                objective,
                input: inputFromIr(node, 'detect_clues'),
            });
        case 'tool_call':
            return stampIrProvenance(node, {
                id: node.id,
                action: 'write_data',
                name: (_e = node.name) !== null && _e !== void 0 ? _e : '提交变更',
                objective,
                input: inputFromIr(node, 'write_data'),
            });
    }
    throw new Error(`materializeDirectIrNode: unhandled direct type ${node.type}`);
}
exports.materializeDirectIrNode = materializeDirectIrNode;
function materializeExpandIrNode(node) {
    var _a, _b, _c, _d, _e, _f;
    const cfg = (_a = node.config) !== null && _a !== void 0 ? _a : {};
    const objective = objectiveFromIrNode(node);
    switch (node.type) {
        case 'llm':
            if ((_b = cfg.capabilities) === null || _b === void 0 ? void 0 : _b.vision) {
                return [
                    stampIrProvenance(node, {
                        id: node.id,
                        action: 'summarize_images',
                        name: (_c = node.name) !== null && _c !== void 0 ? _c : '图片识别',
                        objective,
                        input: inputFromIr(node, 'summarize_images'),
                    }),
                ];
            }
            return [
                stampIrProvenance(node, {
                    id: `${node.id}__draft`,
                    action: 'summarize',
                    name: (_d = node.name) !== null && _d !== void 0 ? _d : '生成',
                    objective,
                    input: inputFromIr(node, 'summarize'),
                }),
            ];
        case 'data_transform':
            if (cfg.purpose === 'compose_mutation') {
                return [
                    stampIrProvenance(node, {
                        id: node.id,
                        action: 'compose_mutation',
                        name: (_e = node.name) !== null && _e !== void 0 ? _e : '组装变更参数',
                        objective,
                        input: inputFromIr(node, 'compose_mutation'),
                    }),
                ];
            }
            return [];
        case 'human_task': {
            const explain = cfg.explainBeforeConfirm === true;
            const awaitDef = stampIrProvenance(node, {
                id: node.id,
                action: 'await_user_confirm',
                name: (_f = node.name) !== null && _f !== void 0 ? _f : '等待用户确认',
                objective,
                input: inputFromIr(node, 'await_user_confirm'),
            });
            if (!explain) {
                return [awaitDef];
            }
            return [
                stampIrProvenance(node, {
                    id: `${node.id}__present`,
                    action: 'present_mutation',
                    name: '展示变更草稿',
                    objective: 'Present the pending mutation draft.',
                    input: inputFromIr(node, 'present_mutation'),
                }),
                awaitDef,
            ];
        }
        default:
            return [];
    }
}
exports.materializeExpandIrNode = materializeExpandIrNode;
function materializeIrNodeToDefs(node) {
    if ((0, map_ir_type_to_legacy_action_util_1.isIrDirectExecutorType)(node.type)) {
        return [materializeDirectIrNode(node)];
    }
    return materializeExpandIrNode(node);
}
exports.materializeIrNodeToDefs = materializeIrNodeToDefs;
function workflowIrHasExpandTypes(ir) {
    return ir.nodes.some((node) => !(0, map_ir_type_to_legacy_action_util_1.isIrDirectExecutorType)(node.type));
}
exports.workflowIrHasExpandTypes = workflowIrHasExpandTypes;
function materializeWorkflowGraphFromIr(ir) {
    var _a;
    const nodes = [];
    const edges = [];
    const entryOf = new Map();
    const exitOf = new Map();
    for (const node of ir.nodes) {
        const materialized = materializeIrNodeToDefs(node);
        if (materialized.length === 0) {
            throw new Error(`materializeWorkflowGraphFromIr: IR node "${node.id}" (type=${node.type}) produced no executable nodes`);
        }
        entryOf.set(node.id, materialized[0].id);
        exitOf.set(node.id, materialized[materialized.length - 1].id);
        nodes.push(...materialized);
        for (let i = 0; i < materialized.length - 1; i++) {
            edges.push({
                id: `ir:${materialized[i].id}->${materialized[i + 1].id}`,
                from: materialized[i].id,
                to: materialized[i + 1].id,
                kind: 'always',
            });
        }
    }
    for (const e of ir.edges) {
        const from = exitOf.get(e.from);
        const to = entryOf.get(e.to);
        if (!from || !to) {
            throw new Error(`materializeWorkflowGraphFromIr: cannot map edge ${e.id} (${e.from}→${e.to})`);
        }
        if (e.kind === 'when') {
            edges.push({
                id: e.id,
                from,
                to,
                kind: 'clue',
                clue: e.when
                    ? {
                        key: e.when,
                        description: ((_a = e.whenDescription) === null || _a === void 0 ? void 0 : _a.trim()) || e.when,
                    }
                    : undefined,
            });
        }
        else if (e.kind === 'default') {
            edges.push({ id: e.id, from, to, kind: 'default' });
        }
        else {
            edges.push({ id: e.id, from, to, kind: 'always' });
        }
    }
    const entryNodeId = entryOf.get(ir.entryNodeId);
    if (!entryNodeId) {
        throw new Error(`materializeWorkflowGraphFromIr: entryNodeId "${ir.entryNodeId}" has no materialized entry`);
    }
    const directOnly = !workflowIrHasExpandTypes(ir);
    return {
        nodes,
        edges,
        entryNodeId,
        materializedDirectFromIr: directOnly,
        ir,
    };
}
exports.materializeWorkflowGraphFromIr = materializeWorkflowGraphFromIr;
function workflowIrNeedsLegacyLower(_ir) {
    return false;
}
exports.workflowIrNeedsLegacyLower = workflowIrNeedsLegacyLower;
//# sourceMappingURL=materialize-workflow-graph-from-ir.util.js.map