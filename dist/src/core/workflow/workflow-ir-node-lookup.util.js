"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSourceIrNode = exports.indexWorkflowIrNodesById = exports.isMaterializedExpandSubStep = void 0;
function isMaterializedExpandSubStep(def) {
    return (def.irNodeId != null &&
        def.irNodeId.length > 0 &&
        def.id !== def.irNodeId);
}
exports.isMaterializedExpandSubStep = isMaterializedExpandSubStep;
function indexWorkflowIrNodesById(ir) {
    return new Map(ir.nodes.map((node) => [node.id, node]));
}
exports.indexWorkflowIrNodesById = indexWorkflowIrNodesById;
function resolveSourceIrNode(def, ir) {
    var _a;
    const irNodeId = (_a = def.irNodeId) !== null && _a !== void 0 ? _a : def.id;
    return indexWorkflowIrNodesById(ir).get(irNodeId);
}
exports.resolveSourceIrNode = resolveSourceIrNode;
//# sourceMappingURL=workflow-ir-node-lookup.util.js.map