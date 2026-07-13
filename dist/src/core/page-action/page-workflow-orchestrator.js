"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestratePageWorkflow = void 0;
const page_action_run_steps_util_1 = require("./page-action-run-steps.util");
const page_workflow_runtime_util_1 = require("./page-workflow-runtime.util");
const page_workflow_mutation_react_util_1 = require("./page-workflow-mutation-react.util");
const page_workflow_pending_write_util_1 = require("./page-workflow-pending-write.util");
const workflow_run_util_1 = require("../workflow/workflow-run.util");
const workflow_resume_util_1 = require("../workflow/workflow-resume.util");
const workflow_debug_util_1 = require("../workflow/trace/workflow-debug.util");
const page_workflow_node_runner_util_1 = require("../workflow/page/page-workflow-node-runner.util");
const page_workflow_node_util_1 = require("./page-workflow-node.util");
const draft_review_1 = require("../draft-review");
const resolve_approval_parties_util_1 = require("../approval/resolve-approval-parties.util");
async function orchestratePageWorkflow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const recorder = (_a = input.stepRecorder) !== null && _a !== void 0 ? _a : new page_action_run_steps_util_1.PageActionRunStepRecorder();
    const runtime = (0, page_workflow_runtime_util_1.createPageWorkflowExecutorRuntime)(input, recorder);
    if (input.resumeFrom) {
        runtime.nodeOutputs = Object.assign({}, input.resumeFrom.nodeOutputs);
    }
    let workflowRun = (_c = (_b = input.resumeFrom) === null || _b === void 0 ? void 0 : _b.workflowRun) !== null && _c !== void 0 ? _c : (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: input.workflowId,
        version: input.version,
        nodes: input.nodes,
        compiledFrom: input.resumeFrom ? 'resume' : 'workflow_db',
    });
    if ((_d = input.resumeFrom) === null || _d === void 0 ? void 0 : _d.advancePastAwait) {
        workflowRun = (0, workflow_resume_util_1.advanceWorkflowRunAfterWriteConfirm)(workflowRun);
    }
    (0, workflow_debug_util_1.logWorkflowDebug)('page_workflow_start', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        workflowId: input.workflowId,
        version: input.version,
        resumed: input.resumeFrom != null,
        nodeIds: input.nodes.map((row) => row.id),
        workflowRun,
    });
    while (workflowRun.currentNodeId && workflowRun.status === 'running') {
        const nodeId = workflowRun.currentNodeId;
        const def = input.nodes.find((row) => row.id === nodeId);
        if (!def) {
            return buildSuspendedOrFinal({
                workflowNodes: input.nodes,
                workflowRun: Object.assign(Object.assign({}, workflowRun), { status: 'failed' }),
                runtime,
                recorder,
                errorCode: 'NODE_DEF_MISSING',
                errorMessage: `workflow node definition missing: ${nodeId}`,
            });
        }
        workflowRun = (0, workflow_run_util_1.startWorkflowNode)(workflowRun, nodeId);
        (0, page_workflow_node_runner_util_1.recordPageWorkflowNodeStart)({
            action: def.action,
            nodeId,
            recorder,
        });
        const nodeResult = await (0, page_workflow_node_runner_util_1.executePageWorkflowNode)({
            def,
            nodeId,
            workflowRun,
            runtime,
            actionRunId: input.actionRunId,
            actionKey: input.actionKey,
        });
        workflowRun = nodeResult.workflowRun;
        if (nodeResult.kind === 'failed') {
            return buildSuspendedOrFinal({
                workflowNodes: input.nodes,
                workflowRun,
                runtime,
                recorder,
                errorCode: nodeResult.errorCode,
                errorMessage: nodeResult.errorMessage,
            });
        }
        if (nodeResult.kind === 'react') {
            const reactResult = await (0, page_workflow_mutation_react_util_1.runPageWorkflowMutationReact)({
                def,
                nodeId,
                workflowRun,
                runtime,
                allowedToolIds: input.allowedToolIds,
                pendingWrite: (_f = (_e = input.resumeFrom) === null || _e === void 0 ? void 0 : _e.pendingWrite) !== null && _f !== void 0 ? _f : null,
            });
            workflowRun = reactResult.workflowRun;
            if (reactResult.ok === false) {
                return buildSuspendedOrFinal({
                    workflowNodes: input.nodes,
                    workflowRun,
                    runtime,
                    recorder,
                    errorCode: reactResult.errorCode,
                    errorMessage: reactResult.errorMessage,
                });
            }
            runtime.nodeOutputs[nodeId] = reactResult.nodeOutput;
            workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(workflowRun);
            if (!workflowRun.currentNodeId && workflowRun.status === 'running') {
                workflowRun = (0, workflow_run_util_1.finalizeWorkflowRun)(workflowRun, 'completed');
            }
            continue;
        }
        if (nodeResult.kind === 'suspend') {
            if (!input.approvalGate) {
                return buildSuspendedOrFinal({
                    workflowNodes: input.nodes,
                    workflowRun,
                    runtime,
                    recorder,
                    errorCode: 'APPROVAL_GATE_UNAVAILABLE',
                    errorMessage: 'Approval gate service required for await_user_confirm',
                });
            }
            const pendingWrite = (0, page_workflow_pending_write_util_1.resolvePageWorkflowPendingWrite)({
                nodes: input.nodes,
                nodeOutputs: runtime.nodeOutputs,
            });
            if (!pendingWrite) {
                return buildSuspendedOrFinal({
                    workflowNodes: input.nodes,
                    workflowRun,
                    runtime,
                    recorder,
                    errorCode: 'PENDING_WRITE_MISSING',
                    errorMessage: 'await_user_confirm requires composed write in nodeOutputs',
                });
            }
            const parties = (0, resolve_approval_parties_util_1.resolveApprovalParties)({
                source: 'page_action',
                initiatorUserId: input.userId,
                triggerBinding: (_g = input.approvalTriggerBinding) !== null && _g !== void 0 ? _g : null,
            });
            if (parties.ok === false) {
                return buildSuspendedOrFinal({
                    workflowNodes: input.nodes,
                    workflowRun,
                    runtime,
                    recorder,
                    errorCode: 'APPROVAL_PARTIES_INVALID',
                    errorMessage: `Cannot resolve approval parties: ${parties.code}`,
                });
            }
            const presentSummary = (0, page_workflow_pending_write_util_1.resolvePageWorkflowPresentSummary)({
                nodes: input.nodes,
                nodeOutputs: runtime.nodeOutputs,
                fillText: runtime.fillText,
            });
            const writeDraft = (0, draft_review_1.buildPageWriteDraft)({
                tool: {
                    name: pendingWrite.tool,
                    toolId: pendingWrite.toolId,
                    riskLevel: pendingWrite.riskLevel,
                    arguments: pendingWrite.arguments,
                },
                summaryText: presentSummary,
                fillText: runtime.fillText,
                draftRetryCount: input.existingApprovalRequestId != null
                    ? undefined
                    : 0,
                lastEvent: 'composed',
            });
            const approval = await input.approvalGate.suspend({
                appClientId: input.appClientId,
                source: 'page_action',
                initiatorUserId: parties.parties.initiatorUserId,
                approverUserId: parties.parties.approverUserId,
                workflowId: input.workflowId,
                workflowVersion: input.version,
                nodeId,
                title: `${input.actionKey} · ${def.name}`,
                writeDraft,
                workflowRun,
                workflowNodeDefs: input.nodes,
                workflowNodeOutputs: Object.assign({}, runtime.nodeOutputs),
                scopedToolIds: input.allowedToolIds,
                pageContext: input.pageContext,
                pageActionRunId: input.actionRunId,
                idempotencyKey: (_h = input.pageActionKey) !== null && _h !== void 0 ? _h : null,
                channel: { kind: 'page_action', pageActionRunId: input.actionRunId },
                stepRecorder: recorder,
                existingApprovalRequestId: (_j = input.existingApprovalRequestId) !== null && _j !== void 0 ? _j : null,
            });
            (0, workflow_debug_util_1.logWorkflowDebug)('page_workflow_suspended', {
                actionRunId: input.actionRunId,
                approvalRequestId: approval.id,
                nodeId,
                workflowRun,
            });
            return Object.assign(Object.assign({}, (0, page_workflow_runtime_util_1.buildPageWorkflowRunnerResult)({
                workflowNodes: input.nodes,
                workflowRun,
                runtime,
                recorder,
                suspended: true,
                approvalRequestId: approval.id,
            })), { suspended: true, approvalRequestId: approval.id });
        }
        if (nodeResult.kind === 'completed') {
            (0, page_workflow_node_util_1.applyPageWorkflowNodeOutput)(runtime, nodeResult.outcome);
            workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(workflowRun);
            if (!workflowRun.currentNodeId && workflowRun.status === 'running') {
                workflowRun = (0, workflow_run_util_1.finalizeWorkflowRun)(workflowRun, 'completed');
            }
            (0, workflow_debug_util_1.logWorkflowDebug)('page_node_advanced', {
                actionRunId: input.actionRunId,
                actionKey: input.actionKey,
                nodeId,
                workflowRun,
            });
        }
    }
    (0, workflow_debug_util_1.logWorkflowDebug)('page_workflow_finish', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        workflowRun,
        fillTextLength: runtime.fillText.trim().length,
        dslOutcome: runtime.dslOutcome,
    });
    return buildSuspendedOrFinal({
        workflowNodes: input.nodes,
        workflowRun,
        runtime,
        recorder,
    });
}
exports.orchestratePageWorkflow = orchestratePageWorkflow;
function buildSuspendedOrFinal(input) {
    return Object.assign(Object.assign({}, (0, page_workflow_runtime_util_1.buildPageWorkflowRunnerResult)({
        workflowNodes: input.workflowNodes,
        workflowRun: input.workflowRun,
        runtime: input.runtime,
        recorder: input.recorder,
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
    })), { suspended: false });
}
//# sourceMappingURL=page-workflow-orchestrator.js.map