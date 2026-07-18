"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkflowAdvanceNode = void 0;
const client_1 = require("../../../../../../../generated/prisma/client");
const agent_run_steps_util_1 = require("../../run/agent-run-steps.util");
const workflow_run_util_1 = require("../../../../../workflow/workflow-run.util");
const workflow_graph_routing_util_1 = require("../../../../../workflow/workflow-graph-routing.util");
const workflow_plan_sync_util_1 = require("../../../../../workflow/workflow-plan-sync.util");
const workflow_debug_util_1 = require("../../../../../workflow/trace/workflow-debug.util");
function createWorkflowAdvanceNode(bundle) {
    const { deps, ctx, runHelpers } = bundle;
    return async (state) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const run = state.workflowRun;
        if (!run) {
            return state;
        }
        const current = (0, workflow_graph_routing_util_1.getCurrentWorkflowNode)(state);
        let workflowRun = run;
        if (state.workflowExecutionMode === 'ir_native_direct' &&
            state.workflowIr &&
            (current === null || current === void 0 ? void 0 : current.nodeId) &&
            (current.status === 'succeeded' || current.status === 'skipped')) {
            const irNode = state.workflowIr.nodes.find((row) => row.id === current.nodeId);
            if (irNode) {
                const phaseStep = (0, workflow_run_util_1.tryAdvanceNativePhaseAfterNodeSuccess)({
                    run: workflowRun,
                    nodeId: current.nodeId,
                    irNode,
                });
                if (phaseStep.advancedPhase) {
                    workflowRun = phaseStep.workflowRun;
                    const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
                    const advanceStep = {
                        step: stepNum,
                        type: 'workflow',
                        name: current.nodeId,
                        output: runHelpers.normalizeJsonLike({
                            nodeId: current.nodeId,
                            action: current.action,
                            priorStatus: current.status,
                            event: 'phase_advanced',
                            nextPhase: (_a = workflowRun.nodes.find((n) => n.nodeId === current.nodeId)) === null || _a === void 0 ? void 0 : _a.phase,
                            workflowStatus: workflowRun.status,
                        }),
                    };
                    const steps = [...state.steps, advanceStep];
                    await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
                    (0, workflow_debug_util_1.logWorkflowDebug)('workflow_phase_advance', {
                        runId: ctx.input.runId,
                        nodeId: current.nodeId,
                        workflowRun,
                    });
                    return Object.assign(Object.assign({}, state), { steps,
                        workflowRun, workflowAwaitingReact: false });
                }
            }
        }
        workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(workflowRun);
        const wasRunning = workflowRun.status === 'running';
        workflowRun = (0, workflow_run_util_1.finalizeWorkflowRunAfterAdvance)(workflowRun);
        if (wasRunning && workflowRun.status === 'completed') {
            deps.sse.emitThink(ctx.input.sessionId, ctx.input.runId, 'Workflow 步骤已全部完成。\n', 'delta');
        }
        const advancedNode = workflowRun.currentNodeId
            ? workflowRun.nodes.find((row) => row.nodeId === workflowRun.currentNodeId)
            : null;
        const stepNum = (0, agent_run_steps_util_1.nextRunStepNumber)(state.steps);
        const advanceStep = {
            step: stepNum,
            type: 'workflow',
            name: (_b = current === null || current === void 0 ? void 0 : current.nodeId) !== null && _b !== void 0 ? _b : 'workflow',
            output: runHelpers.normalizeJsonLike({
                nodeId: (_c = current === null || current === void 0 ? void 0 : current.nodeId) !== null && _c !== void 0 ? _c : null,
                action: (_d = current === null || current === void 0 ? void 0 : current.action) !== null && _d !== void 0 ? _d : null,
                priorStatus: (_e = current === null || current === void 0 ? void 0 : current.status) !== null && _e !== void 0 ? _e : null,
                event: 'node_advanced',
                nextNodeId: workflowRun.currentNodeId,
                nextAction: (_f = advancedNode === null || advancedNode === void 0 ? void 0 : advancedNode.action) !== null && _f !== void 0 ? _f : null,
                workflowStatus: workflowRun.status,
            }),
        };
        const steps = [...state.steps, advanceStep];
        await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
        (0, workflow_debug_util_1.logWorkflowDebug)('workflow_advance', {
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            turnId: ctx.input.turnId,
            nodeId: (_g = current === null || current === void 0 ? void 0 : current.nodeId) !== null && _g !== void 0 ? _g : null,
            action: (_h = current === null || current === void 0 ? void 0 : current.action) !== null && _h !== void 0 ? _h : null,
            priorStatus: (_j = current === null || current === void 0 ? void 0 : current.status) !== null && _j !== void 0 ? _j : null,
            workflowRun,
            finalized: workflowRun.status === 'completed',
        });
        const taskPlan = (_k = (0, workflow_plan_sync_util_1.projectTaskPlanFromWorkflowRun)({
            taskPlan: state.taskPlan,
            workflowRun,
            workflowNodeDefs: state.workflowNodeDefs,
        })) !== null && _k !== void 0 ? _k : state.taskPlan;
        return Object.assign(Object.assign({}, state), { steps,
            workflowRun,
            taskPlan, workflowAwaitingReact: false });
    };
}
exports.createWorkflowAdvanceNode = createWorkflowAdvanceNode;
//# sourceMappingURL=workflow-advance.node.js.map