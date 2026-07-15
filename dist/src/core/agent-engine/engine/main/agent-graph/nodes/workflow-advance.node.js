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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const run = state.workflowRun;
        if (!run) {
            return state;
        }
        const current = (0, workflow_graph_routing_util_1.getCurrentWorkflowNode)(state);
        const completedNodeId = current === null || current === void 0 ? void 0 : current.nodeId;
        let workflowRun = (0, workflow_run_util_1.advanceWorkflowRun)(run);
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
            name: (_a = current === null || current === void 0 ? void 0 : current.nodeId) !== null && _a !== void 0 ? _a : 'workflow',
            output: runHelpers.normalizeJsonLike({
                nodeId: (_b = current === null || current === void 0 ? void 0 : current.nodeId) !== null && _b !== void 0 ? _b : null,
                action: (_c = current === null || current === void 0 ? void 0 : current.action) !== null && _c !== void 0 ? _c : null,
                priorStatus: (_d = current === null || current === void 0 ? void 0 : current.status) !== null && _d !== void 0 ? _d : null,
                event: 'node_advanced',
                nextNodeId: workflowRun.currentNodeId,
                nextAction: (_e = advancedNode === null || advancedNode === void 0 ? void 0 : advancedNode.action) !== null && _e !== void 0 ? _e : null,
                workflowStatus: workflowRun.status,
            }),
        };
        const steps = [...state.steps, advanceStep];
        await runHelpers.updateRun(ctx.input.runId, steps, client_1.AgentRunStatus.running);
        (0, workflow_debug_util_1.logWorkflowDebug)('workflow_advance', {
            runId: ctx.input.runId,
            sessionId: ctx.input.sessionId,
            turnId: ctx.input.turnId,
            nodeId: (_f = current === null || current === void 0 ? void 0 : current.nodeId) !== null && _f !== void 0 ? _f : null,
            action: (_g = current === null || current === void 0 ? void 0 : current.action) !== null && _g !== void 0 ? _g : null,
            priorStatus: (_h = current === null || current === void 0 ? void 0 : current.status) !== null && _h !== void 0 ? _h : null,
            workflowRun,
            finalized: workflowRun.status === 'completed',
        });
        const taskPlan = (_j = (0, workflow_plan_sync_util_1.projectTaskPlanFromWorkflowRun)({
            taskPlan: state.taskPlan,
            workflowRun,
            workflowNodeDefs: state.workflowNodeDefs,
        })) !== null && _j !== void 0 ? _j : state.taskPlan;
        return Object.assign(Object.assign({}, state), { steps,
            workflowRun,
            taskPlan, workflowAwaitingReact: false });
    };
}
exports.createWorkflowAdvanceNode = createWorkflowAdvanceNode;
//# sourceMappingURL=workflow-advance.node.js.map