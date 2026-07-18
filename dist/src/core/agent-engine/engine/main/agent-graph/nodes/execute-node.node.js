"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveExecuteNodeDef = exports.createExecuteNodeNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const harness_runner_1 = require("../../../../../harness/harness-runner");
const harness_trace_util_1 = require("../../../../../harness/trace/harness-trace.util");
const resolve_workflow_node_executor_util_1 = require("../../../../../workflow/executors/resolve-workflow-node-executor.util");
const executor_host_util_1 = require("../../../../../workflow/executors/executor-host.util");
const workflow_plan_sync_util_1 = require("../../../../../workflow/workflow-plan-sync.util");
const workflow_run_util_1 = require("../../../../../workflow/workflow-run.util");
const workflow_graph_routing_util_1 = require("../../../../../workflow/workflow-graph-routing.util");
const workflow_summarize_sync_util_1 = require("../../../../../workflow/workflow-summarize-sync.util");
const workflow_await_user_confirm_gate_util_1 = require("../../../../../workflow/workflow-await-user-confirm-gate.util");
const workflow_debug_util_1 = require("../../../../../workflow/trace/workflow-debug.util");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const project_ir_run_status_util_1 = require("../../../../../workflow/project-ir-run-status.util");
const chatHarness = (0, harness_runner_1.createChatHarnessRunner)();
function mergeExecutorGraphState(base, patch) {
    var _a;
    const merged = (0, workflow_plan_sync_util_1.applyWorkflowTaskPlanProjection)(Object.assign(Object.assign({}, base), patch));
    const workflowAwaitingReact = (_a = patch.workflowAwaitingReact) !== null && _a !== void 0 ? _a : (0, workflow_plan_sync_util_1.deriveWorkflowAwaitingReact)({
        workflowRun: merged.workflowRun,
        workflowNodeDefs: merged.workflowNodeDefs,
    });
    return Object.assign(Object.assign({}, merged), { workflowAwaitingReact });
}
function createExecuteNodeNode(bundle) {
    const { deps, ctx, runHelpers } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f;
        const debugBase = {
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            turnId: ctx.input.turnId,
        };
        const run = state.workflowRun;
        const nodeId = run === null || run === void 0 ? void 0 : run.currentNodeId;
        if (!run || !nodeId) {
            return state;
        }
        const def = (0, workflow_graph_routing_util_1.resolveWorkflowNodeDefForExecute)({
            nodeId,
            defs: state.workflowNodeDefs,
            ir: state.workflowIr,
            executionMode: state.workflowExecutionMode,
            phase: (_a = run.nodes.find((n) => n.nodeId === nodeId)) === null || _a === void 0 ? void 0 : _a.phase,
        });
        if (!def) {
            return state;
        }
        const workflowRun = (0, workflow_plan_sync_util_1.ensureWorkflowNodeStarted)(run, nodeId);
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        const workflowStep = {
            step: stepNum,
            type: 'workflow',
            name: nodeId,
            output: runHelpers.normalizeJsonLike({
                nodeId,
                action: def.action,
                irNodeId: (_b = def.irNodeId) !== null && _b !== void 0 ? _b : null,
                irType: (_c = def.irType) !== null && _c !== void 0 ? _c : null,
                executionMode: (_d = state.workflowExecutionMode) !== null && _d !== void 0 ? _d : null,
                nodeStatus: 'running',
                event: 'node_start',
            }),
        };
        const stepsWithStart = [...state.steps, workflowStep];
        await runHelpers.updateRun(ctx.input.runId, stepsWithStart, client_1.AgentRunStatus.running);
        deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, `正在执行：${def.name}…\n`, 'delta');
        const resolved = (0, resolve_workflow_node_executor_util_1.resolveWorkflowNodeExecutor)(def, 'chat');
        const executor = resolved.executor;
        if (!executor) {
            const failedRun = (0, workflow_run_util_1.failWorkflowNode)(workflowRun, nodeId, {
                code: 'action_not_implemented',
                message: `Workflow action not implemented: ${resolved.action}`,
            });
            (0, workflow_debug_util_1.logWorkflowDebug)('execute_node', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, dispatchKind: resolved.dispatchKind, outcome: 'not_implemented', workflowRun: failedRun }));
            return Object.assign(Object.assign({}, state), { steps: stepsWithStart, workflowRun: failedRun, workflowAwaitingReact: false });
        }
        (0, workflow_debug_util_1.logWorkflowDebug)('execute_node_dispatch', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, irNodeId: resolved.irNodeId, dispatchKind: resolved.dispatchKind, executionMode: (_e = state.workflowExecutionMode) !== null && _e !== void 0 ? _e : null, currentIrNodeId: (0, project_ir_run_status_util_1.resolveCurrentIrNodeId)(workflowRun) }));
        const harnessResult = await chatHarness.runNode({
            ctx: {
                nodeId,
                action: resolved.action,
                profile: 'chat',
            },
            execute: () => executor.run((0, executor_host_util_1.chatExecutorContext)({
                bundle,
                state: Object.assign(Object.assign({}, state), { workflowRun }),
                def,
                nodeId,
                workflowRun,
            })),
        });
        const outcome = harnessResult.value;
        const harnessOutput = (0, harness_trace_util_1.harnessTraceToAgentStepOutput)(harnessResult.trace);
        const stepsWithHarness = [
            ...stepsWithStart,
            {
                step: stepNum + 1,
                type: 'workflow',
                name: `${nodeId}:harness`,
                output: runHelpers.normalizeJsonLike(harnessOutput),
            },
        ];
        if (outcome.kind === 'failed') {
            (0, workflow_debug_util_1.logWorkflowDebug)('execute_node', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, dispatchKind: resolved.dispatchKind, outcome: 'failed', error: outcome.error, workflowRun: outcome.workflowRun, harnessTrace: harnessOutput }));
            return Object.assign(Object.assign({}, state), { steps: stepsWithHarness, workflowRun: outcome.workflowRun, workflowAwaitingReact: false });
        }
        if (outcome.kind === 'completed') {
            (0, workflow_debug_util_1.logWorkflowDebug)('execute_node', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, dispatchKind: resolved.dispatchKind, outcome: 'completed', outputRef: (_f = outcome.outputRef) !== null && _f !== void 0 ? _f : null, workflowRun: outcome.workflowRun }));
            return (0, workflow_summarize_sync_util_1.mergeWorkflowExecutorOutcome)(mergeExecutorGraphState(Object.assign(Object.assign({}, state), { steps: stepsWithHarness }), {
                workflowAwaitingReact: false,
                pendingRespond: null,
            }), {
                workflowRun: outcome.workflowRun,
                outputRef: outcome.outputRef,
                nodeOutput: outcome.nodeOutput,
            });
        }
        if (outcome.kind === 'pending_summarize') {
            (0, workflow_debug_util_1.logWorkflowDebug)('execute_node', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, dispatchKind: resolved.dispatchKind, outcome: 'pending_summarize', workflowRun: outcome.workflowRun }));
            return mergeExecutorGraphState(Object.assign(Object.assign({}, state), { steps: stepsWithHarness }), {
                workflowRun: outcome.workflowRun,
                workflowAwaitingReact: false,
                pendingRespond: outcome.pendingRespond,
            });
        }
        if (outcome.kind === 'awaiting_user_confirm') {
            (0, workflow_debug_util_1.logWorkflowDebug)('execute_node', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, dispatchKind: resolved.dispatchKind, outcome: 'awaiting_user_confirm', workflowRun: outcome.workflowRun }));
            const projected = mergeExecutorGraphState(state, {
                steps: stepsWithHarness,
                workflowRun: outcome.workflowRun,
            });
            if (!projected.taskPlan) {
                return projected;
            }
            return (0, workflow_await_user_confirm_gate_util_1.applyWorkflowAwaitUserConfirmGate)(bundle, projected, {
                steps: stepsWithHarness,
                workflowRun: outcome.workflowRun,
                taskPlan: projected.taskPlan,
                nodeId,
            });
        }
        (0, workflow_debug_util_1.logWorkflowDebug)('execute_node', Object.assign(Object.assign({}, debugBase), { nodeId, action: resolved.action, irType: resolved.irType, dispatchKind: resolved.dispatchKind, outcome: 'delegate_react', workflowAwaitingReact: outcome.workflowAwaitingReact, workflowRun: outcome.workflowRun }));
        return mergeExecutorGraphState(Object.assign(Object.assign({}, state), { steps: stepsWithHarness }), {
            workflowRun: outcome.workflowRun,
            workflowAwaitingReact: outcome.workflowAwaitingReact,
            pendingRespond: null,
        });
    };
}
exports.createExecuteNodeNode = createExecuteNodeNode;
function resolveExecuteNodeDef(defs, nodeId) {
    return (0, workflow_graph_routing_util_1.getWorkflowNodeDef)(defs, nodeId);
}
exports.resolveExecuteNodeDef = resolveExecuteNodeDef;
//# sourceMappingURL=execute-node.node.js.map