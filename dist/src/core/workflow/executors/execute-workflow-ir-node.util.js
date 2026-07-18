"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflowIrNode = void 0;
const workflow_ir_native_direct_util_1 = require("../workflow-ir-native-direct.util");
const executor_host_util_1 = require("./executor-host.util");
const resolve_workflow_node_executor_util_1 = require("./resolve-workflow-node-executor.util");
async function executeWorkflowIrNode(input) {
    let def;
    try {
        def = (0, workflow_ir_native_direct_util_1.materializeNativeFlatIrNode)(input.irNode);
    }
    catch (_a) {
        return {
            kind: 'failed',
            workflowRun: input.workflowRun,
            error: {
                code: 'ir_type_not_native_flat',
                message: `IR type "${input.irNode.type}" is not 1:1 executable on native lane`,
            },
        };
    }
    const profile = input.host.profile;
    const resolved = (0, resolve_workflow_node_executor_util_1.resolveWorkflowNodeExecutor)(def, profile);
    if (!resolved.executor) {
        return {
            kind: 'failed',
            workflowRun: input.workflowRun,
            error: {
                code: 'action_not_implemented',
                message: `No executor for IR type ${input.irNode.type} (${resolved.action})`,
            },
        };
    }
    if (input.host.profile === 'page') {
        return resolved.executor.run((0, executor_host_util_1.pageExecutorContext)({
            runtime: input.host.runtime,
            def,
            nodeId: input.nodeId,
            workflowRun: input.workflowRun,
        }));
    }
    return resolved.executor.run({
        host: input.host,
        def,
        nodeId: input.nodeId,
        workflowRun: input.workflowRun,
    });
}
exports.executeWorkflowIrNode = executeWorkflowIrNode;
//# sourceMappingURL=execute-workflow-ir-node.util.js.map