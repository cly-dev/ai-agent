"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowNodesAreIrDispatched = exports.resolveWorkflowNodeExecutor = void 0;
const map_ir_type_to_legacy_action_util_1 = require("../map-ir-type-to-legacy-action.util");
const executor_registry_1 = require("./executor-registry");
function resolveWorkflowNodeExecutor(def, profile = 'chat') {
    const irType = def.irType;
    const irNodeId = def.irNodeId;
    if (irType && (0, map_ir_type_to_legacy_action_util_1.isIrDirectExecutorType)(irType)) {
        const mapped = (0, map_ir_type_to_legacy_action_util_1.legacyActionForDirectIrType)(irType);
        const action = mapped !== null && mapped !== void 0 ? mapped : def.action;
        return {
            executor: (0, executor_registry_1.getWorkflowExecutorByIrType)(irType, profile),
            action,
            dispatchKind: 'ir_direct',
            irType,
            irNodeId,
        };
    }
    if (irType) {
        const mapping = (0, map_ir_type_to_legacy_action_util_1.mapIrTypeToLegacyAction)(irType);
        if (mapping.kind === 'expand') {
            return {
                executor: (0, executor_registry_1.getWorkflowExecutor)(def.action, profile),
                action: def.action,
                dispatchKind: 'ir_expand_adapter',
                irType,
                irNodeId,
            };
        }
    }
    return {
        executor: (0, executor_registry_1.getWorkflowExecutor)(def.action, profile),
        action: def.action,
        dispatchKind: 'legacy_action',
        irType,
        irNodeId,
    };
}
exports.resolveWorkflowNodeExecutor = resolveWorkflowNodeExecutor;
function workflowNodesAreIrDispatched(nodes) {
    return nodes.length > 0 && nodes.every((n) => n.irType != null);
}
exports.workflowNodesAreIrDispatched = workflowNodesAreIrDispatched;
//# sourceMappingURL=resolve-workflow-node-executor.util.js.map