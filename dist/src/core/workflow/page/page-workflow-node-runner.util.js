"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPageWorkflowNodeStart = exports.executePageWorkflowNode = void 0;
const harness_runner_1 = require("../../harness/harness-runner");
const sensors_1 = require("../../harness/sensors");
const page_workflow_node_util_1 = require("../../page-action/page-workflow-node.util");
const page_action_inline_sse_util_1 = require("../../page-action/page-action-inline-sse.util");
const page_workflow_node_dispatch_util_1 = require("../../page-action/page-workflow-node-dispatch.util");
const page_action_run_audit_util_1 = require("../../page-action/page-action-run-audit.util");
const workflow_run_util_1 = require("../workflow-run.util");
const workflow_debug_util_1 = require("../trace/workflow-debug.util");
const executor_host_util_1 = require("../executors/executor-host.util");
const executor_registry_1 = require("../executors/executor-registry");
async function executePageWorkflowNode(input) {
    var _a, _b, _c, _d, _e, _f;
    const executor = (0, executor_registry_1.getWorkflowExecutor)(input.def.action, 'page');
    if (!executor) {
        return {
            kind: 'failed',
            workflowRun: (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, input.nodeId, {
                code: 'action_not_implemented',
                message: `Page workflow action not implemented: ${input.def.action}`,
            }),
            errorCode: 'action_not_implemented',
            errorMessage: `Page workflow action not implemented: ${input.def.action}`,
        };
    }
    const harness = (0, harness_runner_1.createPageHarnessRunner)((0, sensors_1.harnessSensorsForWorkflowAction)(input.def.action));
    (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.res, {
        phase: 'start',
        actionRunId: input.runtime.actionRunId,
        actionKey: input.runtime.actionKey,
        generation: input.runtime.generation,
        clientActionId: input.runtime.clientActionId,
        nodeId: input.nodeId,
        action: input.def.action,
        workflowStatus: input.workflowRun.status,
        currentNodeId: input.workflowRun.currentNodeId,
    });
    const emitWorkflowNodeFailed = (errorCode, errorMessage, workflowRun = input.workflowRun) => {
        (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.res, {
            phase: 'failed',
            actionRunId: input.runtime.actionRunId,
            actionKey: input.runtime.actionKey,
            generation: input.runtime.generation,
            clientActionId: input.runtime.clientActionId,
            nodeId: input.nodeId,
            action: input.def.action,
            workflowStatus: workflowRun.status,
            currentNodeId: workflowRun.currentNodeId,
            errorCode,
            errorMessage,
        });
    };
    let rawOutcome;
    try {
        rawOutcome = await executor.run((0, executor_host_util_1.pageExecutorContext)({
            runtime: input.runtime,
            def: input.def,
            nodeId: input.nodeId,
            workflowRun: input.workflowRun,
        }));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node', {
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            nodeId: input.nodeId,
            action: input.def.action,
            outcome: 'executor_error',
            errorMessage: message,
            workflowRun: input.workflowRun,
        });
        const failedRun = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, input.nodeId, {
            code: 'EXECUTOR_ERROR',
            message,
        });
        emitWorkflowNodeFailed('EXECUTOR_ERROR', message, failedRun);
        return {
            kind: 'failed',
            workflowRun: failedRun,
            errorCode: 'EXECUTOR_ERROR',
            errorMessage: message,
        };
    }
    const dispatch = (0, page_workflow_node_dispatch_util_1.dispatchPageWorkflowNodeOutcome)({
        nodeId: input.nodeId,
        rawOutcome,
    });
    if (dispatch.action === 'fail') {
        emitWorkflowNodeFailed(dispatch.errorCode, dispatch.errorMessage, dispatch.workflowRun);
        return {
            kind: 'failed',
            workflowRun: dispatch.workflowRun,
            errorCode: dispatch.errorCode,
            errorMessage: dispatch.errorMessage,
        };
    }
    if (dispatch.action === 'suspend') {
        (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.res, {
            phase: 'awaiting_approval',
            actionRunId: input.runtime.actionRunId,
            actionKey: input.runtime.actionKey,
            generation: input.runtime.generation,
            clientActionId: input.runtime.clientActionId,
            nodeId: input.nodeId,
            action: input.def.action,
            workflowStatus: dispatch.workflowRun.status,
            currentNodeId: dispatch.workflowRun.currentNodeId,
        });
        (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node', {
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            nodeId: input.nodeId,
            action: input.def.action,
            outcome: 'awaiting_user_confirm',
            workflowRun: dispatch.workflowRun,
        });
        return {
            kind: 'suspend',
            workflowRun: dispatch.workflowRun,
            outcome: dispatch.outcome,
            nodeId: dispatch.nodeId,
        };
    }
    if (dispatch.action === 'react') {
        (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node', {
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            nodeId: input.nodeId,
            action: input.def.action,
            outcome: 'delegate_react',
            workflowRun: dispatch.workflowRun,
        });
        return {
            kind: 'react',
            workflowRun: dispatch.workflowRun,
            outcome: dispatch.outcome,
        };
    }
    const outcome = dispatch.outcome;
    const sensorFailed = await (0, page_workflow_node_util_1.runPageWorkflowHarnessSensors)({
        harness,
        nodeId: input.nodeId,
        action: input.def.action,
        payload: (0, page_workflow_node_util_1.buildPageHarnessSensorPayload)(input.def.action, outcome),
        recorder: input.runtime.stepRecorder,
    });
    if (sensorFailed) {
        const failedRun = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, input.nodeId, {
            code: (_a = sensorFailed.code) !== null && _a !== void 0 ? _a : 'HARNESS_SENSOR_FAIL',
            message: (_b = sensorFailed.message) !== null && _b !== void 0 ? _b : 'Harness sensor failed',
        });
        emitWorkflowNodeFailed((_c = sensorFailed.code) !== null && _c !== void 0 ? _c : 'HARNESS_SENSOR_FAIL', sensorFailed.message, failedRun);
        return {
            kind: 'failed',
            workflowRun: failedRun,
            errorCode: (_d = sensorFailed.code) !== null && _d !== void 0 ? _d : 'HARNESS_SENSOR_FAIL',
            errorMessage: sensorFailed.message,
        };
    }
    (0, page_workflow_node_util_1.applyPageWorkflowNodeOutput)(input.runtime, outcome);
    input.runtime.stepRecorder.record({
        type: 'workflow',
        name: `${input.nodeId}:complete`,
        detail: Object.assign({ outputRef: outcome.outputRef, action: input.def.action }, (0, page_action_run_audit_util_1.buildWorkflowNodeCompleteAudit)(input.def.action, outcome.nodeOutput)),
    });
    (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.res, {
        phase: 'complete',
        actionRunId: input.runtime.actionRunId,
        actionKey: input.runtime.actionKey,
        generation: input.runtime.generation,
        clientActionId: input.runtime.clientActionId,
        nodeId: input.nodeId,
        action: input.def.action,
        workflowStatus: outcome.workflowRun.status,
        currentNodeId: outcome.workflowRun.currentNodeId,
        outputRef: (_e = outcome.outputRef) !== null && _e !== void 0 ? _e : null,
    });
    (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        nodeId: input.nodeId,
        action: input.def.action,
        outcome: 'completed',
        outputRef: (_f = outcome.outputRef) !== null && _f !== void 0 ? _f : null,
        workflowRun: outcome.workflowRun,
    });
    return {
        kind: 'completed',
        workflowRun: outcome.workflowRun,
        outcome,
    };
}
exports.executePageWorkflowNode = executePageWorkflowNode;
function recordPageWorkflowNodeStart(input) {
    input.recorder.record({
        type: 'workflow',
        name: `${input.nodeId}:start`,
        detail: { action: input.action, nodeId: input.nodeId },
    });
}
exports.recordPageWorkflowNodeStart = recordPageWorkflowNodeStart;
//# sourceMappingURL=page-workflow-node-runner.util.js.map