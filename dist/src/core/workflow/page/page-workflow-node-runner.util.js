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
const resolve_workflow_node_executor_util_1 = require("../executors/resolve-workflow-node-executor.util");
const project_ir_run_status_util_1 = require("../project-ir-run-status.util");
async function executePageWorkflowNode(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const resolved = (0, resolve_workflow_node_executor_util_1.resolveWorkflowNodeExecutor)(input.def, 'page');
    const executor = resolved.executor;
    if (!executor) {
        return {
            kind: 'failed',
            workflowRun: (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, input.nodeId, {
                code: 'action_not_implemented',
                message: `Page workflow action not implemented: ${resolved.action}`,
            }),
            errorCode: 'action_not_implemented',
            errorMessage: `Page workflow action not implemented: ${resolved.action}`,
        };
    }
    (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node_dispatch', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        nodeId: input.nodeId,
        action: resolved.action,
        irType: resolved.irType,
        irNodeId: resolved.irNodeId,
        dispatchKind: resolved.dispatchKind,
        currentIrNodeId: (0, project_ir_run_status_util_1.resolveCurrentIrNodeId)(input.workflowRun),
    });
    const harness = (0, harness_runner_1.createPageHarnessRunner)((0, sensors_1.harnessSensorsForWorkflowAction)(resolved.action));
    const irSseFields = {
        irNodeId: (_a = resolved.irNodeId) !== null && _a !== void 0 ? _a : null,
        irType: (_b = resolved.irType) !== null && _b !== void 0 ? _b : null,
    };
    (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.sseSink, Object.assign(Object.assign({ phase: 'start', actionRunId: input.runtime.actionRunId, actionKey: input.runtime.actionKey, generation: input.runtime.generation, clientActionId: input.runtime.clientActionId, nodeId: input.nodeId, action: resolved.action }, irSseFields), { workflowStatus: input.workflowRun.status, currentNodeId: input.workflowRun.currentNodeId, currentIrNodeId: (0, project_ir_run_status_util_1.resolveCurrentIrNodeId)(input.workflowRun) }));
    const emitWorkflowNodeFailed = (errorCode, errorMessage, workflowRun = input.workflowRun) => {
        (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.sseSink, Object.assign(Object.assign({ phase: 'failed', actionRunId: input.runtime.actionRunId, actionKey: input.runtime.actionKey, generation: input.runtime.generation, clientActionId: input.runtime.clientActionId, nodeId: input.nodeId, action: resolved.action }, irSseFields), { workflowStatus: workflowRun.status, currentNodeId: workflowRun.currentNodeId, currentIrNodeId: (0, project_ir_run_status_util_1.resolveCurrentIrNodeId)(workflowRun), errorCode,
            errorMessage }));
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
            action: resolved.action,
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
        (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.sseSink, Object.assign(Object.assign({ phase: 'awaiting_approval', actionRunId: input.runtime.actionRunId, actionKey: input.runtime.actionKey, generation: input.runtime.generation, clientActionId: input.runtime.clientActionId, nodeId: input.nodeId, action: resolved.action }, irSseFields), { workflowStatus: dispatch.workflowRun.status, currentNodeId: dispatch.workflowRun.currentNodeId, currentIrNodeId: (0, project_ir_run_status_util_1.resolveCurrentIrNodeId)(dispatch.workflowRun) }));
        (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node', {
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
            nodeId: input.nodeId,
            action: resolved.action,
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
            action: resolved.action,
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
        action: resolved.action,
        payload: (0, page_workflow_node_util_1.buildPageHarnessSensorPayload)(resolved.action, outcome),
        recorder: input.runtime.stepRecorder,
    });
    if (sensorFailed) {
        const failedRun = (0, workflow_run_util_1.failWorkflowNode)(input.workflowRun, input.nodeId, {
            code: (_c = sensorFailed.code) !== null && _c !== void 0 ? _c : 'HARNESS_SENSOR_FAIL',
            message: (_d = sensorFailed.message) !== null && _d !== void 0 ? _d : 'Harness sensor failed',
        });
        emitWorkflowNodeFailed((_e = sensorFailed.code) !== null && _e !== void 0 ? _e : 'HARNESS_SENSOR_FAIL', sensorFailed.message, failedRun);
        return {
            kind: 'failed',
            workflowRun: failedRun,
            errorCode: (_f = sensorFailed.code) !== null && _f !== void 0 ? _f : 'HARNESS_SENSOR_FAIL',
            errorMessage: sensorFailed.message,
        };
    }
    (0, page_workflow_node_util_1.applyPageWorkflowNodeOutput)(input.runtime, outcome);
    input.runtime.stepRecorder.record({
        type: 'workflow',
        name: `${input.nodeId}:complete`,
        detail: Object.assign({ outputRef: outcome.outputRef, action: resolved.action }, (0, page_action_run_audit_util_1.buildWorkflowNodeCompleteAudit)(resolved.action, outcome.nodeOutput)),
    });
    (0, page_action_inline_sse_util_1.writePageWorkflowNodeSse)(input.runtime.sseSink, Object.assign(Object.assign({ phase: 'complete', actionRunId: input.runtime.actionRunId, actionKey: input.runtime.actionKey, generation: input.runtime.generation, clientActionId: input.runtime.clientActionId, nodeId: input.nodeId, action: resolved.action }, irSseFields), { workflowStatus: outcome.workflowRun.status, currentNodeId: outcome.workflowRun.currentNodeId, currentIrNodeId: (0, project_ir_run_status_util_1.resolveCurrentIrNodeId)(outcome.workflowRun), outputRef: (_g = outcome.outputRef) !== null && _g !== void 0 ? _g : null }));
    (0, workflow_debug_util_1.logWorkflowDebug)('page_execute_node', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        nodeId: input.nodeId,
        action: resolved.action,
        irType: resolved.irType,
        dispatchKind: resolved.dispatchKind,
        outcome: 'completed',
        outputRef: (_h = outcome.outputRef) !== null && _h !== void 0 ? _h : null,
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