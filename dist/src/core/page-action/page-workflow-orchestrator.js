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
const workflow_ir_native_direct_util_1 = require("../workflow/workflow-ir-native-direct.util");
const entity_materialization_1 = require("../entity-materialization");
const workflow_ir_native_phase_util_1 = require("../workflow/workflow-ir-native-phase.util");
async function orchestratePageWorkflow(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const recorder = (_a = input.stepRecorder) !== null && _a !== void 0 ? _a : new page_action_run_steps_util_1.PageActionRunStepRecorder();
    const runtime = (0, page_workflow_runtime_util_1.createPageWorkflowExecutorRuntime)(input, recorder);
    runtime.materializedEntities = (0, entity_materialization_1.materializeEntitiesFromRuntimeContext)({
        pageContext: input.pageContext,
        actionContext: (_b = input.actionContext) !== null && _b !== void 0 ? _b : null,
    });
    if (!input.resumeFrom) {
        (0, entity_materialization_1.recordPageActionEntityMaterialization)(recorder, runtime.materializedEntities);
    }
    if (input.resumeFrom) {
        runtime.nodeOutputs = Object.assign({}, input.resumeFrom.nodeOutputs);
    }
    let workflowRun = (_d = (_c = input.resumeFrom) === null || _c === void 0 ? void 0 : _c.workflowRun) !== null && _d !== void 0 ? _d : (0, workflow_run_util_1.initWorkflowRun)({
        workflowId: input.workflowId,
        version: input.version,
        nodes: input.nodes,
        edges: input.edges,
        entryNodeId: input.entryNodeId,
        compiledFrom: input.flowId ? 'flow_db' : 'workflow_db',
        phasesByNodeId: input.executionMode === 'ir_native_direct' && input.ir
            ? Object.fromEntries(input.ir.nodes.map((node) => [
                node.id,
                (0, workflow_ir_native_phase_util_1.resolveWorkflowIrNativePhases)(node)[0],
            ]))
            : undefined,
    });
    if ((_e = input.resumeFrom) === null || _e === void 0 ? void 0 : _e.advancePastAwait) {
        workflowRun = (0, workflow_resume_util_1.advanceWorkflowRunAfterWriteConfirm)(workflowRun);
    }
    (0, workflow_debug_util_1.logWorkflowDebug)('page_workflow_start', {
        actionRunId: input.actionRunId,
        actionKey: input.actionKey,
        workflowId: input.workflowId,
        version: input.version,
        resumed: input.resumeFrom != null,
        nodeIds: input.nodes.map((row) => row.id),
        executionMode: (_f = input.executionMode) !== null && _f !== void 0 ? _f : 'materialized_expand',
        irNodeCount: (_h = (_g = input.ir) === null || _g === void 0 ? void 0 : _g.nodes.length) !== null && _h !== void 0 ? _h : 0,
        workflowRun,
    });
    while (workflowRun.currentNodeId && workflowRun.status === 'running') {
        const nodeId = workflowRun.currentNodeId;
        const runNode = workflowRun.nodes.find((row) => row.nodeId === nodeId);
        const irNode = input.executionMode === 'ir_native_direct'
            ? (_j = input.ir) === null || _j === void 0 ? void 0 : _j.nodes.find((row) => row.id === nodeId)
            : undefined;
        const def = irNode != null
            ? (() => {
                try {
                    const phase = runNode === null || runNode === void 0 ? void 0 : runNode.phase;
                    return phase
                        ? (0, workflow_ir_native_phase_util_1.materializeWorkflowIrNodeForPhase)(irNode, phase)
                        : (0, workflow_ir_native_direct_util_1.materializeNativeFlatIrNode)(irNode);
                }
                catch (_a) {
                    return undefined;
                }
            })()
            : input.nodes.find((row) => row.id === nodeId);
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
                pendingWrite: (_l = (_k = input.resumeFrom) === null || _k === void 0 ? void 0 : _k.pendingWrite) !== null && _l !== void 0 ? _l : null,
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
            workflowRun = (0, workflow_run_util_1.finalizeWorkflowRunAfterAdvance)(workflowRun);
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
                triggerBinding: (_m = input.approvalTriggerBinding) !== null && _m !== void 0 ? _m : null,
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
            if (input.flowId == null || input.flowId <= 0) {
                throw new Error('PageAction approval requires flowId; legacy Workflow path removed');
            }
            const approval = await input.approvalGate.suspend({
                appClientId: input.appClientId,
                source: 'page_action',
                initiatorUserId: parties.parties.initiatorUserId,
                approverUserId: parties.parties.approverUserId,
                flowId: input.flowId,
                flowVersion: (_o = input.flowVersion) !== null && _o !== void 0 ? _o : input.version,
                nodeId,
                title: `${input.actionKey} · ${def.name}`,
                writeDraft,
                workflowRun,
                workflowNodeDefs: input.nodes,
                workflowNodeOutputs: Object.assign({}, runtime.nodeOutputs),
                scopedToolIds: input.allowedToolIds,
                pageContext: input.pageContext,
                pageActionRunId: input.actionRunId,
                idempotencyKey: (_p = input.pageActionKey) !== null && _p !== void 0 ? _p : null,
                channel: { kind: 'page_action', pageActionRunId: input.actionRunId },
                stepRecorder: recorder,
                existingApprovalRequestId: (_q = input.existingApprovalRequestId) !== null && _q !== void 0 ? _q : null,
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
            if (input.executionMode === 'ir_native_direct' && irNode) {
                const phaseStep = (0, workflow_run_util_1.tryAdvanceNativePhaseAfterNodeSuccess)({
                    run: workflowRun,
                    nodeId,
                    irNode,
                });
                workflowRun = phaseStep.workflowRun;
                if (phaseStep.advancedPhase) {
                    (0, workflow_debug_util_1.logWorkflowDebug)('page_node_phase_advanced', {
                        actionRunId: input.actionRunId,
                        actionKey: input.actionKey,
                        nodeId,
                        phase: (_r = workflowRun.nodes.find((n) => n.nodeId === nodeId)) === null || _r === void 0 ? void 0 : _r.phase,
                        workflowRun,
                    });
                    continue;
                }
            }
            workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(workflowRun);
            workflowRun = (0, workflow_run_util_1.finalizeWorkflowRunAfterAdvance)(workflowRun);
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