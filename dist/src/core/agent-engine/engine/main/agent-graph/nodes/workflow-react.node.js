"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWorkflowReactRoute = exports.createWorkflowReactNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const turn_graph_util_1 = require("../../../turn/turn-graph.util");
const paged_list_gather_util_1 = require("../../../gather/paged-list-gather.util");
const plan_observation_scope_util_1 = require("../../plan/plan-observation-scope.util");
const workflow_graph_routing_util_1 = require("../../../../../workflow/workflow-graph-routing.util");
const sensors_1 = require("../../../../../harness/sensors");
const degrade_policy_1 = require("../../../../../harness/policies/degrade.policy");
const harness_runner_1 = require("../../../../../harness/harness-runner");
const harness_trace_util_1 = require("../../../../../harness/trace/harness-trace.util");
const workflow_harness_util_1 = require("../../../../../workflow/workflow-harness.util");
const workflow_run_util_1 = require("../../../../../workflow/workflow-run.util");
const workflow_debug_util_1 = require("../../../../../workflow/trace/workflow-debug.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const agent_run_audit_util_1 = require("../../run/agent-run-audit.util");
const task_plan_util_1 = require("../../plan/task-plan.util");
const gather_pipeline_audit_util_1 = require("../../../turn/gather-pipeline-audit.util");
const readiness_node_1 = require("./readiness.node");
const tool_resolve_node_1 = require("./tool-resolve.node");
const llm_node_1 = require("./llm.node");
const param_gate_node_1 = require("./param-gate.node");
const tools_node_1 = require("./tools.node");
const result_check_node_1 = require("./result-check.node");
function createWorkflowReactNode(bundle) {
    const { deps, ctx, runHelpers } = bundle;
    const readiness = (0, readiness_node_1.createReadinessNode)(bundle);
    const toolResolve = (0, tool_resolve_node_1.createToolResolveNode)(bundle);
    const llm = (0, llm_node_1.createLlmNode)(bundle);
    const paramGate = (0, param_gate_node_1.createParamGateNode)(bundle);
    const tools = (0, tools_node_1.createToolsNode)(bundle);
    const resultCheck = (0, result_check_node_1.createResultCheckNode)(bundle);
    return async (state) => {
        var _a, _b, _c, _d, _e, _f;
        if (!state.workflowAwaitingReact || state.finished) {
            return state;
        }
        const maxSteps = ctx.input.maxSteps;
        let current = state;
        let guard = 0;
        while (current.workflowAwaitingReact &&
            !current.finished &&
            guard < maxSteps) {
            guard += 1;
            if ((0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                break;
            }
            current = await readiness(current);
            if (current.finished || (0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                break;
            }
            current = await toolResolve(current);
            if (current.finished || (0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                break;
            }
            current = await llm(current);
            if (current.finished || (0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                break;
            }
            current = await paramGate(current);
            if (current.finished || (0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                break;
            }
            current = await resultCheck(current);
            if (current.finished || (0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                break;
            }
            if (!current.workflowAwaitingReact) {
                break;
            }
            if ((0, paged_list_gather_util_1.shouldRouteGraphToTools)({
                pendingToolCalls: current.pendingToolCalls,
                taskPlan: current.taskPlan,
                scopedTools: current.scopedTools,
                observations: (0, plan_observation_scope_util_1.selectObservationsForPagedGatherResume)((0, plan_observation_scope_util_1.planObservationBucketsFromState)(current)),
            })) {
                current = await tools(current);
                if (current.finished) {
                    break;
                }
                current = await resultCheck(current);
                if (current.finished || (0, turn_graph_util_1.shouldRouteToRespond)(current)) {
                    break;
                }
                if (!current.workflowAwaitingReact) {
                    break;
                }
            }
        }
        const nodeId = (_a = current.workflowRun) === null || _a === void 0 ? void 0 : _a.currentNodeId;
        const def = (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(current.workflowNodeDefs, nodeId);
        const currentNode = (0, workflow_graph_routing_util_1.getCurrentWorkflowNode)(current);
        if (nodeId &&
            def &&
            currentNode &&
            (currentNode.status === 'succeeded' || !current.workflowAwaitingReact)) {
            const sensors = (0, sensors_1.harnessSensorsForWorkflowAction)(def.action);
            if (sensors.length > 0 && current.workflowRun) {
                const harness = new harness_runner_1.HarnessRunner({
                    sensors,
                    policy: degrade_policy_1.DEGRADE_POLICY,
                });
                const sensorResult = await harness.runAfterNodeSensors({
                    ctx: { nodeId, action: def.action, profile: 'chat' },
                    payload: (0, workflow_harness_util_1.buildHarnessSensorPayload)(def, current),
                });
                if (sensorResult.trace.length > 0) {
                    const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(current.steps);
                    const harnessStep = {
                        step: stepNum,
                        type: 'workflow',
                        name: `${nodeId}:harness`,
                        output: runHelpers.normalizeJsonLike((0, harness_trace_util_1.harnessTraceToAgentStepOutput)(sensorResult.trace)),
                    };
                    current = Object.assign(Object.assign({}, current), { steps: [...current.steps, harnessStep] });
                }
                if (sensorResult.sensorFailed && current.workflowRun) {
                    const failedRun = (0, workflow_run_util_1.failWorkflowNode)(current.workflowRun, nodeId, {
                        code: (_b = sensorResult.sensorFailed.code) !== null && _b !== void 0 ? _b : 'HARNESS_SENSOR_FAIL',
                        message: (_c = sensorResult.sensorFailed.message) !== null && _c !== void 0 ? _c : 'Harness sensor failed',
                    });
                    (0, workflow_debug_util_1.logWorkflowDebug)('workflow_react_harness_fail', {
                        runId: ctx.input.runId,
                        sessionId: ctx.input.sessionId,
                        turnId: ctx.input.turnId,
                        nodeId,
                        action: def.action,
                        sensor: sensorResult.sensorFailed,
                        workflowRun: failedRun,
                    });
                    current = Object.assign(Object.assign({}, current), { workflowRun: failedRun, workflowAwaitingReact: false, finished: true });
                }
            }
        }
        if (guard >= maxSteps && current.workflowAwaitingReact) {
            deps.logger.warn(`workflow_react hit maxSteps runId=${ctx.input.runId} nodeId=${nodeId !== null && nodeId !== void 0 ? nodeId : 'unknown'}`);
            (0, workflow_debug_util_1.logWorkflowDebug)('workflow_react_max_steps', {
                runId: ctx.input.runId,
                sessionId: ctx.input.sessionId,
                turnId: ctx.input.turnId,
                nodeId: nodeId !== null && nodeId !== void 0 ? nodeId : null,
                guard,
                maxSteps,
                workflowRun: current.workflowRun,
            });
            if (nodeId && current.workflowRun) {
                const failedRun = (0, workflow_run_util_1.failWorkflowNode)(current.workflowRun, nodeId, {
                    code: 'WORKFLOW_REACT_MAX_STEPS',
                    message: `Workflow ReAct loop exceeded maxSteps (${maxSteps})`,
                });
                current = Object.assign(Object.assign({}, current), { workflowRun: failedRun, workflowAwaitingReact: false, finished: true });
            }
        }
        (0, workflow_debug_util_1.logWorkflowDebug)('workflow_react_exit', {
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            turnId: ctx.input.turnId,
            nodeId: nodeId !== null && nodeId !== void 0 ? nodeId : null,
            workflowAwaitingReact: current.workflowAwaitingReact === true,
            finished: current.finished,
            workflowRun: current.workflowRun,
            route: (0, workflow_graph_routing_util_1.routeAfterWorkflowReact)(current),
        });
        const hadGatherPipeline = current.steps.some((step) => step.type === 'tool_resolve' ||
            step.type === 'llm' ||
            step.type === 'param_gate');
        if (hadGatherPipeline) {
            const pendingStep = (0, task_plan_util_1.getPendingPlanToolStep)(current.taskPlan, current.workflowRun);
            const audit = (0, gather_pipeline_audit_util_1.buildGatherPipelineAudit)({
                steps: current.steps,
                planStepId: (_f = (_d = pendingStep === null || pendingStep === void 0 ? void 0 : pendingStep.id) !== null && _d !== void 0 ? _d : (_e = current.taskPlan) === null || _e === void 0 ? void 0 : _e.currentStepId) !== null && _f !== void 0 ? _f : null,
                pendingClarification: (0, gather_pipeline_audit_util_1.pendingClarificationFromRespond)(current.pendingRespond),
            });
            if (audit.invariantViolations.length > 0) {
                deps.logger.warn(`gather_pipeline invariant violations runId=${ctx.input.runId} violations=${audit.invariantViolations.join(',')}`);
            }
            const auditStepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(current.steps);
            const auditStep = (0, agent_run_audit_util_1.maybeTagWorkflowReactInternalStep)({
                step: auditStepNum,
                type: 'gather_pipeline',
                output: runHelpers.normalizeJsonLike(audit),
            }, current);
            const stepsWithAudit = [...current.steps, auditStep];
            await runHelpers.updateRun(ctx.input.runId, stepsWithAudit, client_1.AgentRunStatus.running);
            current = Object.assign(Object.assign({}, current), { steps: stepsWithAudit });
        }
        return current;
    };
}
exports.createWorkflowReactNode = createWorkflowReactNode;
function resolveWorkflowReactRoute(state) {
    return (0, workflow_graph_routing_util_1.routeAfterWorkflowReact)(state);
}
exports.resolveWorkflowReactRoute = resolveWorkflowReactRoute;
//# sourceMappingURL=workflow-react.node.js.map