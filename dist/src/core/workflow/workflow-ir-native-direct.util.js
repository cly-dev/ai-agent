"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildNativeDirectGraphFromIr = exports.materializeNativeFlatIrNode = exports.irEdgesToWorkflowEdges = exports.isWorkflowIrNativeDirectEligible = exports.isWorkflowIrNodeNativeFlat = void 0;
const materialize_workflow_graph_from_ir_util_1 = require("./materialize-workflow-graph-from-ir.util");
const workflow_ir_native_phase_util_1 = require("./workflow-ir-native-phase.util");
function isWorkflowIrNodeNativeFlat(node) {
    try {
        const defs = (0, materialize_workflow_graph_from_ir_util_1.materializeIrNodeToDefs)(node);
        return defs.length >= 1;
    }
    catch (_a) {
        return false;
    }
}
exports.isWorkflowIrNodeNativeFlat = isWorkflowIrNodeNativeFlat;
function isWorkflowIrNativeDirectEligible(ir) {
    if (ir.nodes.length === 0) {
        return false;
    }
    return ir.nodes.every((node) => isWorkflowIrNodeNativeFlat(node));
}
exports.isWorkflowIrNativeDirectEligible = isWorkflowIrNativeDirectEligible;
function irEdgesToWorkflowEdges(ir) {
    return ir.edges.map((e) => {
        var _a;
        if (e.kind === 'when') {
            return {
                id: e.id,
                from: e.from,
                to: e.to,
                kind: 'clue',
                clue: e.when
                    ? {
                        key: e.when,
                        description: ((_a = e.whenDescription) === null || _a === void 0 ? void 0 : _a.trim()) || e.when,
                    }
                    : undefined,
            };
        }
        if (e.kind === 'default') {
            return { id: e.id, from: e.from, to: e.to, kind: 'default' };
        }
        return { id: e.id, from: e.from, to: e.to, kind: 'always' };
    });
}
exports.irEdgesToWorkflowEdges = irEdgesToWorkflowEdges;
function materializeNativeFlatIrNode(node) {
    const phases = (0, workflow_ir_native_phase_util_1.resolveWorkflowIrNativePhases)(node);
    return (0, workflow_ir_native_phase_util_1.materializeWorkflowIrNodeForPhase)(node, phases[0]);
}
exports.materializeNativeFlatIrNode = materializeNativeFlatIrNode;
function buildNativeDirectGraphFromIr(ir) {
    if (!isWorkflowIrNativeDirectEligible(ir)) {
        throw new Error('buildNativeDirectGraphFromIr: IR is not native eligible');
    }
    const phasesByNodeId = {};
    const nodes = ir.nodes.map((node) => {
        const phase = (0, workflow_ir_native_phase_util_1.resolveWorkflowIrNativePhases)(node)[0];
        phasesByNodeId[node.id] = phase;
        return (0, workflow_ir_native_phase_util_1.materializeWorkflowIrNodeForPhase)(node, phase);
    });
    return {
        nodes,
        edges: irEdgesToWorkflowEdges(ir),
        entryNodeId: ir.entryNodeId,
        ir,
        executionMode: 'ir_native_direct',
        materializedDirectFromIr: true,
        phasesByNodeId,
    };
}
exports.buildNativeDirectGraphFromIr = buildNativeDirectGraphFromIr;
//# sourceMappingURL=workflow-ir-native-direct.util.js.map