"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowerWorkflowIrToLegacyGraph = void 0;
const materialize_workflow_graph_from_ir_util_1 = require("./materialize-workflow-graph-from-ir.util");
function lowerWorkflowIrToLegacyGraph(ir) {
    const materialized = (0, materialize_workflow_graph_from_ir_util_1.materializeWorkflowGraphFromIr)(ir);
    return {
        nodes: materialized.nodes,
        edges: materialized.edges,
        entryNodeId: materialized.entryNodeId,
    };
}
exports.lowerWorkflowIrToLegacyGraph = lowerWorkflowIrToLegacyGraph;
//# sourceMappingURL=lower-ir-to-legacy-graph.util.js.map