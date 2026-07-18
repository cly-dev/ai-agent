"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkflowNodeRuntimeInput = void 0;
const derive_workflow_node_input_from_ir_util_1 = require("./derive-workflow-node-input-from-ir.util");
function resolveWorkflowNodeRuntimeInput(def) {
    if (def.irType != null && def.irConfig != null) {
        const derived = (0, derive_workflow_node_input_from_ir_util_1.deriveWorkflowNodeInputFromIr)({
            irType: def.irType,
            config: def.irConfig,
            action: def.action,
        });
        if (derived != null) {
            return derived;
        }
    }
    return def.input;
}
exports.resolveWorkflowNodeRuntimeInput = resolveWorkflowNodeRuntimeInput;
//# sourceMappingURL=resolve-workflow-node-runtime-input.util.js.map